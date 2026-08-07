import { EventEmitter } from "eventemitter3";

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{ type: string; text?: string; data?: string }>;
  isError?: boolean;
}

export type SpawnFunction = (
    command: string,
    args: string[],
    options: { stdio: string[]; env: Record<string, string> },
  ) => {
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    stdout: { on: (event: string, handler: (buffer: Buffer) => void) => void };
    stderr: { on: (event: string, handler: (buffer: Buffer) => void) => void };
    stdin: { write: (data: string) => void };
    kill: (signal?: string) => void;
  };

export interface MCPClientOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  reconnect?: boolean;
  reconnectDelayMs?: number;
  spawn?: SpawnFunction;
  requestTimeoutMs?: number;
  toolCallRetries?: number;
  toolCallCacheEnabled?: boolean;
}

export class MCPToolCallError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? `Failed to call MCP tool '${toolName}'`);
    this.name = "MCPToolCallError";
  }
}

export class MCPConnectionError extends Error {
  constructor(public readonly cause: unknown, message?: string) {
    super(message ?? "Failed to connect to MCP server");
    this.name = "MCPConnectionError";
  }
}

export class MCPClient extends EventEmitter {
  private readonly command: string;
  private readonly args: string[];
  private readonly env: Record<string, string>;
  private readonly reconnectFlag: boolean;
  private readonly reconnectDelayMs: number;
  private readonly spawnFn: SpawnFunction;
  private readonly requestTimeoutMs: number;

  private tools: MCPTool[] = [];
  private toolCache = new Map<string, MCPTool>();
  private toolResultCache = new Map<string, { result: unknown; cachedAt: number }>();
  private readonly toolCallRetries: number;
  private readonly toolCallCacheEnabled: boolean;
  private child: {
    process: {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      stdout: { on: (event: string, handler: (buffer: Buffer) => void) => void };
      stderr: { on: (event: string, handler: (buffer: Buffer) => void) => void };
      stdin: { write: (data: string) => void };
      kill: (signal?: string) => void;
    };
  } | null = null;
  private connected = false;
  private connecting = false;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: unknown) => void }
  >();
  private initializationPromise: Promise<void> | null = null;
  private serverCapabilities: Record<string, unknown> = {};
  private messageBuffer = "";

  constructor(options: MCPClientOptions) {
    super();
    this.command = options.command;
    this.args = options.args ?? [];
    this.env = options.env ?? {};
    this.reconnectFlag = options.reconnect ?? false;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1000;
    this.spawnFn = options.spawn ?? this.defaultSpawn;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 30000;
    this.toolCallRetries = options.toolCallRetries ?? 2;
    this.toolCallCacheEnabled = options.toolCallCacheEnabled ?? true;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get availableTools(): MCPTool[] {
    return this.tools;
  }

  get capabilities(): Record<string, unknown> {
    return this.serverCapabilities;
  }

  async subscribeToToolChanges(): Promise<void> {
    await this.ensureConnected();
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    if (this.connecting) {
      return this.initializationPromise ?? Promise.resolve();
    }

    this.connecting = true;
    this.initializationPromise = this.initialize();
    try {
      await this.initializationPromise;
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.child) {
      this.child.process.kill("SIGTERM");
      this.child = null;
    }
    this.connected = false;
    this.rejectAllPending(new Error("MCP client disconnected"));
  }

  async listTools(): Promise<MCPTool[]> {
    await this.ensureConnected();
    return this.tools;
  }

  async getTool(name: string): Promise<MCPTool | undefined> {
    return this.toolCache.get(name) ?? this.tools.find((tool) => tool.name === name);
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const tool = await this.getTool(name);
    if (!tool) {
      throw new MCPToolCallError(name, null, `MCP tool '${name}' is not available`);
    }

    const cacheKey = `${name}:${JSON.stringify(args)}`;
    if (this.toolCallCacheEnabled) {
      const cached = this.toolResultCache.get(cacheKey);
      if (cached) {
        return cached.result;
      }
    }

    await this.ensureConnected();

    let attempt = 0;
    let lastError: unknown;
    while (attempt <= this.toolCallRetries) {
      try {
        const result = (await this.sendRequest("tools/call", {
          name: tool.name,
          arguments: args,
        })) as MCPToolResult;

        if (result.isError) {
          const message =
            result.content.find((c) => c.type === "text")?.text ?? "Unknown MCP tool error";
          throw new MCPToolCallError(name, null, message);
        }

        if (this.toolCallCacheEnabled) {
          this.toolResultCache.set(cacheKey, { result: result.content, cachedAt: Date.now() });
        }

        return result.content;
      } catch (error) {
        lastError = error;
        attempt++;
        if (attempt > this.toolCallRetries) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async refreshTools(): Promise<MCPTool[]> {
    this.tools = [];
    this.toolCache.clear();
    this.toolResultCache.clear();

    const result = (await this.sendRequest("tools/list", {})) as {
      tools?: MCPTool[];
    };

    if (result.tools) {
      this.tools = result.tools;
      for (const tool of this.tools) {
        this.toolCache.set(tool.name, tool);
      }
    }

    return this.tools;
  }

  clearToolResultCache(): void {
    this.toolResultCache.clear();
  }

  getToolResultCacheSize(): number {
    return this.toolResultCache.size;
  }

  private async initialize(): Promise<void> {
    await this.spawnProcess();
    const initResponse = (await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        sampling: {},
        roots: { listChanged: true },
      },
      clientInfo: {
        name: "alp-platform-mcp-client",
        version: "80.0.0",
      },
    })) as { capabilities?: Record<string, unknown> };

    if (initResponse?.capabilities) {
      this.serverCapabilities = initResponse.capabilities;
    }

    await this.sendRequest("notifications/initialized", {});
    await this.refreshTools();
    this.connected = true;
    this.emit("connect");
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  private async spawnProcess(): Promise<void> {
    try {
      const mergedEnv = Object.fromEntries(
        Object.entries({ ...process.env, ...this.env }).filter((entry): entry is [string, string] => entry[1] !== undefined),
      );

      const processRef = this.spawnFn(this.command, this.args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: mergedEnv,
      });

      if (!processRef) {
        throw new MCPConnectionError(null, `Failed to spawn MCP server: ${this.command}`);
      }

      this.child = {
        process: {
          on: processRef.on,
          stdout: processRef.stdout,
          stderr: processRef.stderr,
          stdin: processRef.stdin,
          kill: processRef.kill,
        },
      };

      processRef.on("error", (error: unknown) => {
        this.connected = false;
        this.emit("error", error);
        if (this.reconnectFlag && !this.connecting) {
          setTimeout(() => this.connect(), this.reconnectDelayMs);
        }
      });

      processRef.on("exit", (code: unknown) => {
        const wasConnected = this.connected;
        this.connected = false;
        this.child = null;
        this.rejectAllPending(new Error(`MCP server exited with code ${String(code)}`));
        if (wasConnected && this.reconnectFlag && !this.connecting) {
          setTimeout(() => this.connect(), this.reconnectDelayMs);
        }
      });

      processRef.stdout.on("data", (buffer: Buffer) => {
        this.handleMessage(buffer);
      });

      processRef.stderr.on("data", (buffer: Buffer) => {
        this.emit("stderr", buffer.toString());
      });
    } catch (error) {
      throw new MCPConnectionError(error, `Failed to spawn MCP server: ${this.command}`);
    }
  }

  private defaultSpawn = (
    _command: string,
    _args: string[],
    _options: { stdio: string[]; env: Record<string, string> },
  ): {
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    stdout: { on: (event: string, handler: (buffer: Buffer) => void) => void };
    stderr: { on: (event: string, handler: (buffer: Buffer) => void) => void };
    stdin: { write: (data: string) => void };
    kill: (signal?: string) => void;
  } => {
    throw new MCPConnectionError(null, "No spawn function configured");
  };

  private async sendInitialized(): Promise<void> {
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "alp-platform-mcp-client",
        version: "80.0.0",
      },
    });

    await this.sendRequest("notifications/initialized", {});
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const child = this.child;
      if (!child) {
        reject(new MCPConnectionError(null, "MCP server is not running"));
        return;
      }

      const id = ++this.requestId;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new MCPConnectionError(null, `MCP request '${method}' timed out after ${this.requestTimeoutMs}ms`));
      }, this.requestTimeoutMs);

      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const payload = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      const stdin = child.process.stdin;
      if (stdin) {
        const message = JSON.stringify(payload);
        const length = Buffer.byteLength(message, "utf8");
        const framed = `Content-Length: ${length}\r\n\r\n${message}`;
        stdin.write(framed);
      }
    });
  }

  private handleMessage(buffer: Buffer): void {
    this.messageBuffer += buffer.toString();

    while (true) {
      const lengthMatch = this.messageBuffer.match(/Content-Length:\s*(\d+)\r\n\r\n/);
      if (!lengthMatch) {
        break;
      }

      const messageLength = Number(lengthMatch[1]);
      const headerEnd = lengthMatch.index! + lengthMatch[0].length;
      const messageJson = this.messageBuffer.slice(headerEnd, headerEnd + messageLength);

      if (messageJson.length < messageLength) {
        break;
      }

      this.messageBuffer = this.messageBuffer.slice(headerEnd + messageLength);

      try {
        const message = JSON.parse(messageJson) as {
          id?: number;
          result?: unknown;
          error?: { message?: string };
          method?: string;
          params?: unknown;
        };

        if (message.id && this.pendingRequests.has(message.id)) {
          const { resolve, reject } = this.pendingRequests.get(message.id)!;
          this.pendingRequests.delete(message.id);

          if (message.error) {
            reject(new Error(message.error.message ?? "MCP request failed"));
          } else {
            resolve(message.result);
          }
        } else if (message.method === "notifications/progress") {
          this.emit("progress", message.params);
        } else if (message.method === "notifications/tools/list_changed") {
          this.refreshTools().catch(() => {
            // ignore refresh errors during notification handling
          });
          this.emit("toolsChanged");
        } else if (message.method && !message.id) {
          this.emit("notification", message.method, message.params);
        }
      } catch {
        // Ignore malformed JSON messages from MCP server
      }
    }
  }

  private rejectAllPending(error: Error): void {
    for (const { reject } of this.pendingRequests.values()) {
      reject(error);
    }
    this.pendingRequests.clear();
  }
}

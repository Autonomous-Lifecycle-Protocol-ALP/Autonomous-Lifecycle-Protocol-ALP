import { LLMProvider, ProviderCompletionOptions, ProviderCompletionResult, StreamCallback } from "./base";
import { withRetry, DEFAULT_RETRY_OPTIONS } from "./retry";

export class OllamaProvider implements LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly provider = "ollama";
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly models: { id: string; name: string; contextWindow: number; maxOutput: number }[];
  readonly defaultModel: string;
  health: { healthy: boolean; latencyMs: number; lastChecked: string; error?: string };

  constructor(config: {
    id: string;
    name: string;
    apiKey?: string;
    endpoint?: string;
    models: { id: string; name: string; contextWindow: number; maxOutput: number }[];
    defaultModel: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint ?? "http://localhost:11434";
    this.models = config.models;
    this.defaultModel = config.defaultModel;
    this.health = { healthy: true, latencyMs: 0, lastChecked: new Date().toISOString() };
  }

  async complete(modelId: string, prompt: string, options: ProviderCompletionOptions = {}): Promise<ProviderCompletionResult> {
    const onStream = options.onStreamChunk;
    const useStream = options.stream && onStream && this.supportsStreaming(modelId);

    if (useStream) {
      return this.streamComplete(modelId, prompt, options, onStream);
    }

    return withRetry(() => this.executeComplete(modelId, prompt, options), DEFAULT_RETRY_OPTIONS);
  }

  private async executeComplete(modelId: string, prompt: string, options: ProviderCompletionOptions = {}): Promise<ProviderCompletionResult> {
    const url = `${this.endpoint}/api/generate`;
    const body = {
      model: modelId,
      prompt,
      system: options.systemPrompt,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 1024,
      },
    };

    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    this.health.latencyMs = Date.now() - start;
    this.health.lastChecked = new Date().toISOString();
    this.health.healthy = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      this.health.error = `Ollama error ${response.status}: ${errorText}`;
      throw new Error(this.health.error);
    }

    const data = (await response.json()) as { response: string; done: boolean };
    return {
      text: data.response ?? "",
      tokensUsed: 0,
      finishReason: data.done ? "stop" : "unknown",
      raw: data,
    };
  }

  private async streamComplete(modelId: string, prompt: string, options: ProviderCompletionOptions, onStream: StreamCallback): Promise<ProviderCompletionResult> {
    const url = `${this.endpoint}/api/generate`;
    const body = {
      model: modelId,
      prompt,
      system: options.systemPrompt,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 1024,
      },
    };

    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    this.health.latencyMs = Date.now() - start;
    this.health.lastChecked = new Date().toISOString();
    this.health.healthy = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      this.health.error = `Ollama error ${response.status}: ${errorText}`;
      throw new Error(this.health.error);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Ollama streaming response body is not readable");
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let done = false;

    while (!done) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed) as { response?: string; done?: boolean };
          if (data.response) {
            fullText += data.response;
            onStream(data.response);
          }
          if (data.done) {
            done = true;
          }
        } catch {
          // ignore malformed streaming chunks
        }
      }
    }

    return {
      text: fullText,
      tokensUsed: 0,
      finishReason: done ? "stop" : "unknown",
      raw: { streamed: true },
    };
  }

  supportsStreaming(modelId: string): boolean {
    return this.models.some((m) => m.id === modelId);
  }
}

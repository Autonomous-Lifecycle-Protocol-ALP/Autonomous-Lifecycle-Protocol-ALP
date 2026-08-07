import { describe, it, expect } from "vitest";
import { MCPClient, MCPToolCallError, MCPConnectionError } from "../src/tools/mcp-client";

describe("MCPClient", () => {
  it("starts disconnected with empty tool list", async () => {
    const client = new MCPClient({
      command: "node",
      args: ["mock-mcp-server.js"],
    });

    expect(client.isConnected).toBe(false);
    expect(client.availableTools).toEqual([]);
  });

  it("returns undefined for uncached tools before connect", async () => {
    const client = new MCPClient({
      command: "node",
      args: ["mock-mcp-server.js"],
    });

    const tool = await client.getTool("nonexistent");
    expect(tool).toBeUndefined();
  });

  it("rejects with MCPConnectionError when server is not running", async () => {
    const client = new MCPClient({
      command: "node",
      args: ["mock-mcp-server.js"],
    });

    await expect(client.connect()).rejects.toThrow(MCPConnectionError);
  });

  it("clears state on disconnect", async () => {
    const client = new MCPClient({
      command: "node",
      args: ["mock-mcp-server.js"],
    });

    await client.disconnect();
    expect(client.isConnected).toBe(false);
    await expect(client.callTool("anything")).rejects.toThrow(MCPToolCallError);
  });

  it("constructs with default options", async () => {
    const client = new MCPClient({ command: "echo" });

    expect(client.isConnected).toBe(false);
    expect(client.availableTools).toEqual([]);
  });

  it("MCPToolCallError carries tool name", async () => {
    const error = new MCPToolCallError("test_tool", null, "tool not found");
    expect(error.toolName).toBe("test_tool");
    expect(error.message).toBe("tool not found");
  });

  it("MCPConnectionError carries cause", async () => {
    const cause = new Error("spawn failed");
    const error = new MCPConnectionError(cause, "connection failed");
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("connection failed");
  });

  it("throws MCPToolCallError for unknown tools when disconnected", async () => {
    const client = new MCPClient({
      command: "node",
      args: ["mock-mcp-server.js"],
    });

    await expect(client.callTool("unknown_tool")).rejects.toThrow(MCPToolCallError);
  });
});

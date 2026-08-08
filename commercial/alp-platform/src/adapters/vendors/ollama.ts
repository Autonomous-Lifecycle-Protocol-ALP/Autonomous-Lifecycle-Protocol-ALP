import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const OLLAMA_MANIFEST: VendorManifest = {
  id: "ollama",
  name: "Ollama Local",
  type: "onprem",
  auth: { type: "token", scopes: ["inference"] },
  endpoints: {
    llm: "http://localhost:11434",
  },
  capabilities: ["llm", "local-inference"],
};

export class OllamaVendorAdapter extends BaseVendorAdapter {
  readonly vendor = OLLAMA_MANIFEST;
  private endpoint = "http://localhost:11434";

  async connect(): Promise<void> {
    const response = await fetch(`${this.endpoint}/api/tags`);
    if (!response.ok) throw new Error("Ollama not reachable");
  }

  async disconnect(): Promise<void> {
    // no-op for local
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.endpoint}/api/${service}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Ollama ${service} failed`);
    return (await response.json()) as T;
  }
}

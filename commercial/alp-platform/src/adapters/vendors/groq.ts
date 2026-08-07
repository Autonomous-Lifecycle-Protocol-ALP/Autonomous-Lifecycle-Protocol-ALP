import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const GROQ_MANIFEST: VendorManifest = {
  id: "groq",
  name: "Groq",
  type: "cloud",
  auth: { type: "api-key", scopes: ["inference"] },
  endpoints: {
    llm: "https://api.groq.com",
  },
  capabilities: ["llm", "inference", "chat", "fast-inference"],
  rateLimits: { rpm: 6000, tpm: 1200000 },
};

export class GroqVendorAdapter extends BaseVendorAdapter {
  readonly vendor = GROQ_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("Groq API key not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`Groq ${service} invoked without credentials`);
    return { vendor: "groq", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

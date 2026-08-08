import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const DEEPSEEK_MANIFEST: VendorManifest = {
  id: "deepseek",
  name: "DeepSeek",
  type: "cloud",
  auth: { type: "api-key", scopes: ["inference"] },
  endpoints: {
    llm: "https://api.deepseek.com",
  },
  capabilities: ["llm", "inference", "chat"],
  rateLimits: { rpm: 2000, tpm: 500000 },
};

export class DeepSeekVendorAdapter extends BaseVendorAdapter {
  readonly vendor = DEEPSEEK_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("DeepSeek API key not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`DeepSeek ${service} invoked without credentials`);
    return { vendor: "deepseek", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

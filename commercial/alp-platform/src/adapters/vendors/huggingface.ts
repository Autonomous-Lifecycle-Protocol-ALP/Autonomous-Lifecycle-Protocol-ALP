import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const HUGGINGFACE_MANIFEST: VendorManifest = {
  id: "huggingface",
  name: "Hugging Face",
  type: "cloud",
  auth: { type: "token", scopes: ["inference", "models", "spaces"] },
  endpoints: {
    llm: "https://api-inference.huggingface.co",
  },
  capabilities: ["llm", "models", "inference", "spaces"],
  rateLimits: { rpm: 1000, tpm: 500000 },
};

export class HuggingFaceVendorAdapter extends BaseVendorAdapter {
  readonly vendor = HUGGINGFACE_MANIFEST;
  private token?: string;

  async connect(): Promise<void> {
    if (!this.token) throw new Error("Hugging Face token not configured");
  }

  async disconnect(): Promise<void> {
    this.token = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.token) throw new Error(`Hugging Face ${service} invoked without credentials`);
    return { vendor: "huggingface", service, payload } as T;
  }

  configure(token: string) {
    this.token = token;
  }
}

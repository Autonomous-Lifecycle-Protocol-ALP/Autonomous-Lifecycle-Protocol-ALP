import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const NVIDIA_MANIFEST: VendorManifest = {
  id: "nvidia",
  name: "NVIDIA",
  type: "edge",
  auth: { type: "api-key", scopes: ["compute", "inference", "cuML"] },
  endpoints: {
    compute: "https://api.nvidia.com",
    llm: "https://integrate.api.nvidia.com",
  },
  capabilities: ["compute", "llm", "gpu", "edge", "robotics"],
  rateLimits: { rpm: 5000, tpm: 1000000 },
};

export class NvidiaVendorAdapter extends BaseVendorAdapter {
  readonly vendor = NVIDIA_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("NVIDIA API key not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`NVIDIA ${service} invoked without credentials`);
    return { vendor: "nvidia", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

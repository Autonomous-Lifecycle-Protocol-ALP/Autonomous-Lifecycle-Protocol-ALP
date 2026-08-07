import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const GCP_MANIFEST: VendorManifest = {
  id: "gcp",
  name: "Google Cloud Platform",
  type: "cloud",
  region: "us-central1",
  auth: { type: "api-key", scopes: ["compute", "storage", "functions", "vertex-ai", "iot"] },
  endpoints: {
    compute: "https://compute.googleapis.com",
    storage: "https://storage.googleapis.com",
    functions: "https://cloudfunctions.googleapis.com",
    llm: "https://aiplatform.googleapis.com",
    iot: "https://cloudiot.googleapis.com",
  },
  capabilities: ["compute", "storage", "functions", "llm", "iot"],
  rateLimits: { rpm: 9000, tpm: 600000 },
};

export class GCPVendorAdapter extends BaseVendorAdapter {
  readonly vendor = GCP_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("GCP API key not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`GCP ${service} invoked without credentials`);
    return { vendor: "gcp", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

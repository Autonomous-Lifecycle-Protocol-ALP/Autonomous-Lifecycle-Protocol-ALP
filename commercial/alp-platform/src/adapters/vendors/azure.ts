import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const AZURE_MANIFEST: VendorManifest = {
  id: "azure",
  name: "Microsoft Azure",
  type: "cloud",
  auth: { type: "api-key", scopes: ["compute", "storage", "functions", "openai", "iot"] },
  endpoints: {
    compute: "https://management.azure.com",
    storage: "https://storage.azure.com",
    functions: "https://azurefunctions.azure.com",
    llm: "https://openai.azure.com",
    iot: "https://azureiotcentral.com",
  },
  capabilities: ["compute", "storage", "functions", "llm", "iot"],
  rateLimits: { rpm: 12000, tpm: 800000 },
};

export class AzureVendorAdapter extends BaseVendorAdapter {
  readonly vendor = AZURE_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("Azure API key not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`Azure ${service} invoked without credentials`);
    return { vendor: "azure", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

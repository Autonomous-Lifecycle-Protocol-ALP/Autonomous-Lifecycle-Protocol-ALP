import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const IONQ_MANIFEST: VendorManifest = {
  id: "ionq",
  name: "IonQ Quantum",
  type: "quantum",
  auth: { type: "api-key", scopes: ["quantum", "circuit"] },
  endpoints: {
    quantum: "https://api.ionq.co/v0.2",
  },
  capabilities: ["quantum", "qpu", "hybrid-algorithms"],
  rateLimits: { rpm: 100, tpm: 5000 },
};

export class IonQVendorAdapter extends BaseVendorAdapter {
  readonly vendor = IONQ_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("IonQ API key not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`IonQ ${service} invoked without credentials`);
    return { vendor: "ionq", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

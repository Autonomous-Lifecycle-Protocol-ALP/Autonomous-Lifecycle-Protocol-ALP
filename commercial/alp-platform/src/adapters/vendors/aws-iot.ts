import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const AWS_IOT_MANIFEST: VendorManifest = {
  id: "aws-iot",
  name: "AWS IoT",
  type: "hybrid",
  region: "us-east-1",
  auth: { type: "api-key", scopes: ["iot", "device", "sensor"] },
  endpoints: {
    iot: "https://iot.us-east-1.amazonaws.com",
  },
  capabilities: ["iot", "sensor", "actuator", "mqtt", "edge"],
  rateLimits: { rpm: 3000, tpm: 1200000 },
};

export class AWSIoTVendorAdapter extends BaseVendorAdapter {
  readonly vendor = AWS_IOT_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) throw new Error("AWS IoT credentials not configured");
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) throw new Error(`AWS IoT ${service} invoked without credentials`);
    return { vendor: "aws-iot", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

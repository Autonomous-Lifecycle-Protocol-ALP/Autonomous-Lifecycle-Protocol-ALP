import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const AWS_MANIFEST: VendorManifest = {
  id: "aws",
  name: "Amazon Web Services",
  type: "cloud",
  region: "us-east-1",
  auth: { type: "api-key", scopes: ["ec2", "s3", "lambda", "bedrock", "iot"] },
  endpoints: {
    compute: "https://ec2.amazonaws.com",
    storage: "https://s3.amazonaws.com",
    functions: "https://lambda.amazonaws.com",
    llm: "https://bedrock.amazonaws.com",
    iot: "https://iot.amazonaws.com",
  },
  capabilities: ["compute", "storage", "functions", "llm", "iot", "quantum"],
  rateLimits: { rpm: 10000, tpm: 500000 },
};

export class AWSVendorAdapter extends BaseVendorAdapter {
  readonly vendor = AWS_MANIFEST;
  private apiKey?: string;

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("AWS API key not configured");
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new Error(`AWS ${service} invoked without credentials`);
    }
    return { vendor: "aws", service, payload } as T;
  }

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }
}

import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const JETSON_MANIFEST: VendorManifest = {
  id: "nvidia-jetson",
  name: "NVIDIA Jetson",
  type: "edge",
  auth: { type: "token", scopes: ["compute", "inference", "camera", "can"] },
  endpoints: {
    compute: "http://localhost:8000",
    iot: "http://localhost:8888",
  },
  capabilities: ["compute", "llm", "gpu", "edge", "robotics", "camera"],
  rateLimits: { rpm: 2000, tpm: 200000 },
};

export class JetsonVendorAdapter extends BaseVendorAdapter {
  readonly vendor = JETSON_MANIFEST;
  private endpoint = "http://localhost:8000";

  async connect(): Promise<void> {
    const response = await fetch(`${this.endpoint}/health`);
    if (!response.ok) throw new Error("Jetson not reachable");
  }

  async disconnect(): Promise<void> {
    // no-op
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.endpoint}/api/${service}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Jetson ${service} failed`);
    return (await response.json()) as T;
  }
}

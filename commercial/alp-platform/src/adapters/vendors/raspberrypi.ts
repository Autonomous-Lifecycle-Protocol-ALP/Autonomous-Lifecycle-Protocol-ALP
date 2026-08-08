import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const RASPBERRYPI_MANIFEST: VendorManifest = {
  id: "raspberrypi",
  name: "Raspberry Pi",
  type: "edge",
  auth: { type: "token", scopes: ["gpio", "sensor", "camera"] },
  endpoints: {
    iot: "http://localhost:8080",
  },
  capabilities: ["sensor", "actuator", "camera", "gpio", "edge"],
};

export class RaspberryPiVendorAdapter extends BaseVendorAdapter {
  readonly vendor = RASPBERRYPI_MANIFEST;
  private endpoint = "http://localhost:8080";

  async connect(): Promise<void> {
    const response = await fetch(`${this.endpoint}/health`);
    if (!response.ok) throw new Error("Raspberry Pi not reachable");
  }

  async disconnect(): Promise<void> {
    // no-op for local
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.endpoint}/api/${service}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Raspberry Pi ${service} failed`);
    return (await response.json()) as T;
  }
}

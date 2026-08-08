import { VendorAdapter, VendorManifest } from "../types";

export abstract class BaseVendorAdapter implements VendorAdapter {
  abstract readonly vendor: VendorManifest;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract invoke<T = unknown>(service: string, payload: unknown): Promise<T>;

  async health(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.invoke("health", {});
      return { status: "ok", latencyMs: Date.now() - start };
    } catch {
      return { status: "error", latencyMs: Date.now() - start };
    }
  }
}

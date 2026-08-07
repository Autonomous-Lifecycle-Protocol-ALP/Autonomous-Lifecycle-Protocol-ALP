import { BaseVendorAdapter } from "../base";
import { VendorManifest } from "../../types";

export const GITHUB_MANIFEST: VendorManifest = {
  id: "github",
  name: "GitHub",
  type: "cloud",
  auth: { type: "token", scopes: ["repo", "workflow", "packages", "codespaces"] },
  endpoints: {
    compute: "https://api.github.com",
    storage: "https://api.github.com",
    functions: "https://api.github.com",
  },
  capabilities: ["compute", "storage", "functions", "ci-cd", "packages"],
  rateLimits: { rpm: 5000, tpm: 1000000 },
};

export class GitHubVendorAdapter extends BaseVendorAdapter {
  readonly vendor = GITHUB_MANIFEST;
  private token?: string;

  async connect(): Promise<void> {
    if (!this.token) throw new Error("GitHub token not configured");
  }

  async disconnect(): Promise<void> {
    this.token = undefined;
  }

  async invoke<T = unknown>(service: string, payload: unknown): Promise<T> {
    if (!this.token) throw new Error(`GitHub ${service} invoked without credentials`);
    return { vendor: "github", service, payload } as T;
  }

  configure(token: string) {
    this.token = token;
  }
}

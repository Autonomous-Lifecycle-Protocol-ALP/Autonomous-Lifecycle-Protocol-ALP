import { VendorAdapter, FrameworkAdapter, LibraryAdapter, VendorManifest } from "../types";

export class VendorAdapterRegistry {
  private vendors: Map<string, VendorAdapter> = new Map();
  private frameworks: Map<string, FrameworkAdapter> = new Map();
  private libraries: Map<string, LibraryAdapter> = new Map();

  registerVendor(adapter: VendorAdapter): void {
    this.vendors.set(adapter.vendor.id, adapter);
  }

  registerFramework(adapter: FrameworkAdapter): void {
    this.frameworks.set(adapter.id, adapter);
  }

  registerLibrary(adapter: LibraryAdapter): void {
    this.libraries.set(adapter.id, adapter);
  }

  getVendor(id: string): VendorAdapter | undefined {
    return this.vendors.get(id);
  }

  getFramework(id: string): FrameworkAdapter | undefined {
    return this.frameworks.get(id);
  }

  getLibrary(id: string): LibraryAdapter | undefined {
    return this.libraries.get(id);
  }

  listVendors(): VendorManifest[] {
    return Array.from(this.vendors.values()).map((v) => v.vendor);
  }

  listFrameworks(): FrameworkAdapter[] {
    return Array.from(this.frameworks.values());
  }

  listLibraries(): LibraryAdapter[] {
    return Array.from(this.libraries.values());
  }

  listLibrariesByCategory(category: LibraryAdapter["category"]): LibraryAdapter[] {
    return this.listLibraries().filter((lib) => lib.category === category);
  }

  detectFramework(projectRoot: string): Promise<FrameworkAdapter | undefined> {
    return this.detectFromList(this.listFrameworks(), projectRoot);
  }

  async detectFromList(
    adapters: FrameworkAdapter[],
    projectRoot: string
  ): Promise<FrameworkAdapter | undefined> {
    for (const adapter of adapters) {
      if (await adapter.detect(projectRoot)) {
        return adapter;
      }
    }
    return undefined;
  }
}

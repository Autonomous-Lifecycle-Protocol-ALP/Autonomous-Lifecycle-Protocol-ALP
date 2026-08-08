import { describe, it, expect } from "vitest";
import { VendorAdapterRegistry } from "../src/adapters/registry";
import {
  AWSVendorAdapter,
  AzureVendorAdapter,
  GCPVendorAdapter,
  OllamaVendorAdapter,
  NvidiaVendorAdapter,
  RaspberryPiVendorAdapter,
  JetsonVendorAdapter,
  AWSIoTVendorAdapter,
  IonQVendorAdapter,
  GitHubVendorAdapter,
  HuggingFaceVendorAdapter,
  DeepSeekVendorAdapter,
  GroqVendorAdapter,
} from "../src/adapters/vendors";
import {
  ReactFrameworkAdapter,
  VueFrameworkAdapter,
  SvelteFrameworkAdapter,
  NextJsFrameworkAdapter,
  DjangoFrameworkAdapter,
  SpringFrameworkAdapter,
  FlutterFrameworkAdapter,
  DotNetFrameworkAdapter,
} from "../src/adapters/frameworks";
import {
  ShadcnLibraryAdapter,
  TailwindLibraryAdapter,
  ReactQueryLibraryAdapter,
  TensorFlowLibraryAdapter,
  PyTorchLibraryAdapter,
  WebGLibraryAdapter,
  CryptoLibraryAdapter,
  StorageLibraryAdapter,
  TestingLibraryAdapter,
  IoTLibraryAdapter,
  QuantumLibraryAdapter,
} from "../src/adapters/libraries";

describe("VendorAdapterRegistry", () => {
  it("registers and lists vendor adapters", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerVendor(new AWSVendorAdapter());
    registry.registerVendor(new AzureVendorAdapter());
    registry.registerVendor(new GCPVendorAdapter());

    const vendors = registry.listVendors();
    expect(vendors.length).toBe(3);
    expect(vendors.map((v) => v.id).sort()).toEqual(["aws", "azure", "gcp"]);
  });

  it("returns undefined for unknown vendor", () => {
    const registry = new VendorAdapterRegistry();
    expect(registry.getVendor("unknown")).toBeUndefined();
  });

  it("registers and lists framework adapters", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerFramework(new ReactFrameworkAdapter());
    registry.registerFramework(new VueFrameworkAdapter());

    const frameworks = registry.listFrameworks();
    expect(frameworks.length).toBe(2);
    expect(frameworks.map((f) => f.id).sort()).toEqual(["react", "vue"]);
  });

  it("registers and lists library adapters", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerLibrary(new ShadcnLibraryAdapter());
    registry.registerLibrary(new TailwindLibraryAdapter());
    registry.registerLibrary(new TensorFlowLibraryAdapter());

    const libraries = registry.listLibraries();
    expect(libraries.length).toBe(3);
  });

  it("filters libraries by category", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerLibrary(new ShadcnLibraryAdapter());
    registry.registerLibrary(new TailwindLibraryAdapter());
    registry.registerLibrary(new TensorFlowLibraryAdapter());
    registry.registerLibrary(new PyTorchLibraryAdapter());

    const uiLibs = registry.listLibrariesByCategory("ui");
    expect(uiLibs.length).toBe(2);
    expect(uiLibs.map((l) => l.id).sort()).toEqual(["shadcn", "tailwindcss"]);

    const mlLibs = registry.listLibrariesByCategory("ml");
    expect(mlLibs.length).toBe(2);
    expect(mlLibs.map((l) => l.id).sort()).toEqual(["pytorch", "tensorflow"]);
  });

  it("returns empty array for unknown library category", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerLibrary(new ShadcnLibraryAdapter());
    expect(registry.listLibrariesByCategory("audio").length).toBe(0);
  });

  it("detects framework from project root", async () => {
    const registry = new VendorAdapterRegistry();
    registry.registerFramework(new ReactFrameworkAdapter());
    registry.registerFramework(new VueFrameworkAdapter());

    const detected = await registry.detectFramework("/fake/project");
    expect(detected).toBeDefined();
    expect(["react", "vue"]).toContain(detected?.id);
  });

  it("returns all 13 vendors when fully populated", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerVendor(new AWSVendorAdapter());
    registry.registerVendor(new AzureVendorAdapter());
    registry.registerVendor(new GCPVendorAdapter());
    registry.registerVendor(new OllamaVendorAdapter());
    registry.registerVendor(new NvidiaVendorAdapter());
    registry.registerVendor(new RaspberryPiVendorAdapter());
    registry.registerVendor(new JetsonVendorAdapter());
    registry.registerVendor(new AWSIoTVendorAdapter());
    registry.registerVendor(new IonQVendorAdapter());
    registry.registerVendor(new GitHubVendorAdapter());
    registry.registerVendor(new HuggingFaceVendorAdapter());
    registry.registerVendor(new DeepSeekVendorAdapter());
    registry.registerVendor(new GroqVendorAdapter());

    expect(registry.listVendors().length).toBe(13);
  });

  it("returns all 8 frameworks when fully populated", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerFramework(new ReactFrameworkAdapter());
    registry.registerFramework(new VueFrameworkAdapter());
    registry.registerFramework(new SvelteFrameworkAdapter());
    registry.registerFramework(new NextJsFrameworkAdapter());
    registry.registerFramework(new DjangoFrameworkAdapter());
    registry.registerFramework(new SpringFrameworkAdapter());
    registry.registerFramework(new FlutterFrameworkAdapter());
    registry.registerFramework(new DotNetFrameworkAdapter());

    expect(registry.listFrameworks().length).toBe(8);
  });

  it("returns all 11 libraries when fully populated", () => {
    const registry = new VendorAdapterRegistry();
    registry.registerLibrary(new ShadcnLibraryAdapter());
    registry.registerLibrary(new TailwindLibraryAdapter());
    registry.registerLibrary(new ReactQueryLibraryAdapter());
    registry.registerLibrary(new TensorFlowLibraryAdapter());
    registry.registerLibrary(new PyTorchLibraryAdapter());
    registry.registerLibrary(new WebGLibraryAdapter());
    registry.registerLibrary(new CryptoLibraryAdapter());
    registry.registerLibrary(new StorageLibraryAdapter());
    registry.registerLibrary(new TestingLibraryAdapter());
    registry.registerLibrary(new IoTLibraryAdapter());
    registry.registerLibrary(new QuantumLibraryAdapter());

    expect(registry.listLibraries().length).toBe(11);
  });
});

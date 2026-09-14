import { describe, it, expect } from "vitest";
import { Command } from "commander";

describe("@alp/test-cli", () => {
  it("configures the alp-test commander program", () => {
    const program = new Command();
    program
      .name("alp-test")
      .description("ALP Test — autonomous testing for autonomous software")
      .version("0.1.0");

    expect(program.name()).toBe("alp-test");
    expect(program.description()).toBe("ALP Test — autonomous testing for autonomous software");
    expect(program.version()).toBe("0.1.0");
  });
});

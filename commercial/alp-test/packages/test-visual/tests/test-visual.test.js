import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { diffScreenshots, loadBaseline } from "../src/index.js";
import { PNG } from "pngjs";

describe("@alp/test-visual", () => {
  it("throws error when baseline file does not exist", async () => {
    await expect(loadBaseline("non-existent-baseline")).rejects.toThrow(
      "Baseline not found"
    );
  });

  it("diffs identical images with zero mismatched pixels", async () => {
    const tmpDir = path.join(process.cwd(), ".alp-test-tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const baselinePath = path.join(tmpDir, "base.png");
    const actualPath = path.join(tmpDir, "actual.png");
    const diffPath = path.join(tmpDir, "diff.png");

    // Create 10x10 white PNG
    const png = new PNG({ width: 10, height: 10 });
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 255;
        png.data[idx + 1] = 255;
        png.data[idx + 2] = 255;
        png.data[idx + 3] = 255;
      }
    }

    const buffer = PNG.sync.write(png);
    fs.writeFileSync(baselinePath, buffer);
    fs.writeFileSync(actualPath, buffer);

    const result = await diffScreenshots(baselinePath, actualPath, diffPath);
    expect(result.mismatched).toBe(0);
    expect(result.changedPixels).toBe(0);
    expect(fs.existsSync(diffPath)).toBe(true);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

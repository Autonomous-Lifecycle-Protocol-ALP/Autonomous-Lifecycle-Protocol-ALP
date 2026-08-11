import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const BASELINE_DIR = ".alp-test/baselines";
const ACTUAL_DIR = ".alp-test/actual";
const DIFF_DIR = ".alp-test/diff";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export async function captureScreenshot(page, selector, outputPath) {
  const el = selector ? await page.locator(selector) : null;
  const target = el || page;
  await target.screenshot({ path: outputPath });
  return outputPath;
}

export async function diffScreenshots(baselinePath, actualPath, diffPath, threshold = 0.1) {
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const actual = PNG.sync.read(fs.readFileSync(actualPath));
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const mismatched = pixelmatch(baseline.data, actual.data, diff.data, baseline.width, baseline.height, { threshold });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  const changedPixels = ((mismatched / (baseline.width * baseline.height)) * 100).toFixed(2);
  return { mismatched, changedPixels: Number(changedPixels), diffPath };
}

export async function saveBaseline(page, selector, name) {
  ensureDir(BASELINE_DIR);
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  await captureScreenshot(page, selector, baselinePath);
  return baselinePath;
}

export async function loadBaseline(name) {
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline not found: ${baselinePath}`);
  }
  return baselinePath;
}

export async function runVisualRegression(page, specs, { updateBaselines = false } = {}) {
  ensureDir(ACTUAL_DIR);
  ensureDir(DIFF_DIR);
  const results = [];
  for (const spec of specs) {
    const baselinePath = spec.baseline || path.join(BASELINE_DIR, `${spec.name}.png`);
    const actualPath = path.join(ACTUAL_DIR, `actual-${spec.name}-${Date.now()}.png`);
    const diffPath = path.join(DIFF_DIR, `diff-${spec.name}-${Date.now()}.png`);
    await captureScreenshot(page, spec.selector, actualPath);
    if (updateBaselines || !fs.existsSync(baselinePath)) {
      fs.copyFileSync(actualPath, baselinePath);
      results.push({ ...spec, status: "baseline_saved", baselinePath });
      continue;
    }
    const result = await diffScreenshots(baselinePath, actualPath, diffPath, spec.threshold);
    const passed = result.changedPixels < (spec.threshold * 100);
    results.push({ ...spec, ...result, passed, status: passed ? "passed" : "failed" });
  }
  return results;
}

export async function listBaselines() {
  ensureDir(BASELINE_DIR);
  return fs.readdirSync(BASELINE_DIR).filter((f) => f.endsWith(".png"));
}

export async function deleteBaseline(name) {
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  if (fs.existsSync(baselinePath)) {
    fs.unlinkSync(baselinePath);
  }
}

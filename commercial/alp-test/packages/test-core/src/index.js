import { glob } from "tiny-glob";
import { chromium } from "playwright";

export async function runTests({ filter, reporter, visual } = {}) {
  const pattern = filter || "**/*.spec.{js,ts}";
  const files = await glob(pattern, { cwd: process.cwd() });
  const results = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const file of files) {
    try {
      // Dynamic import supports both ESM and CJS test files
      const mod = await import(`file://${process.cwd()}/${file}`);
      const suites = Array.isArray(mod.default) ? mod.default : [mod.default || mod];
      for (const suite of suites) {
        if (!suite || typeof suite !== "function") continue;
        const name = suite.name || file;
        try {
          await suite(page);
          passed++;
          results.push({ file, suite: name, status: "passed" });
        } catch (err) {
          failed++;
          results.push({ file, suite: name, status: "failed", error: err.message });
        }
      }
    } catch (err) {
      skipped++;
      results.push({ file, suite: file, status: "skipped", error: err.message });
    }
  }

  await browser.close();

  const summary = `\n---\n${reporter === "json" ? JSON.stringify(results, null, 2) : results.map((r) => `  ${r.status === "passed" ? "✔" : r.status === "failed" ? "✖" : "○"} ${r.file} > ${r.suite}`).join("\n")}\n---\n`;
  console.log(summary);

  return { passed, failed, skipped, results };
}

export { chromium } from "playwright";

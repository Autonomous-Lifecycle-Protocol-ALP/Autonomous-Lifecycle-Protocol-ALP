import { program } from "commander";
import chalk from "chalk";
import { runTests } from "@alp/test-core";
import { runVisualRegression, saveBaseline, listBaselines } from "@alp/test-visual";
import { generateTestsFromPrompt, healSelector } from "@alp/test-ai";

program
  .name("alp-test")
  .description("ALP Test — autonomous testing for autonomous software")
  .version("0.1.0");

program
  .command("run")
  .description("Run test suites")
  .option("-f, --filter <pattern>", "filter test files by glob")
  .option("-r, --reporter <format>", "reporter format: text | html | json", "text")
  .option("--visual", "enable visual regression checks")
  .action(async (opts) => {
    console.log(chalk.cyan("▶ Running ALP Test..."));
    const result = await runTests({ filter: opts.filter, reporter: opts.reporter, visual: opts.visual });
    console.log(chalk.green(`✔ ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`));
    process.exit(result.failed > 0 ? 1 : 0);
  });

program
  .command("visual")
  .description("Run visual regression suite")
  .option("-b, --baseline <branch>", "baseline branch", "main")
  .option("-u, --update", "update baselines")
  .option("-s, --save-baseline <name>", "save a new baseline")
  .option("-l, --list", "list baselines")
  .action(async (opts) => {
    console.log(chalk.cyan("▶ Running visual regression..."));
    if (opts.list) {
      const baselines = await listBaselines();
      console.log(chalk.gray(`Baselines (${baselines.length}):`));
      baselines.forEach((b) => console.log(chalk.gray(`  - ${b}`)));
      return;
    }
    if (opts.saveBaseline) {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto("http://localhost:5174/");
      const path = await saveBaseline(page, null, opts.saveBaseline);
      await browser.close();
      console.log(chalk.green(`✔ Baseline saved: ${path}`));
      return;
    }
    console.log(chalk.yellow("Visual regression module ready. Use --save-baseline <name> to capture baselines."));
  });

program
  .command("ai")
  .description("AI-assisted test generation")
  .argument("<prompt>", "natural language description of the test")
  .option("-s, --heal <selector>", "heal a selector using AI strategies")
  .action(async (prompt, opts) => {
    console.log(chalk.cyan("▶ Generating tests with AI..."));
    if (opts.heal) {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto("http://localhost:5174/");
      try {
        const locator = await healSelector(page, opts.heal);
        console.log(chalk.green(`✔ Healed selector: ${opts.heal}`));
      } catch (err) {
        console.log(chalk.red(`✖ ${err.message}`));
      }
      await browser.close();
      return;
    }
    const plan = await generateTestsFromPrompt(prompt);
    console.log(chalk.gray(JSON.stringify(plan, null, 2)));
    console.log(chalk.green(`✔ Generated test plan for: ${prompt}`));
  });

program.parse();

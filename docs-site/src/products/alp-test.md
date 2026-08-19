---
title: ALP Test
---

# ALP Test

Autonomous testing product for ALP: Playwright-class E2E, visual regression, and AI-powered test generation in one CLI and library.

## Packages

| Package | Purpose |
|---|---|
| `@alp/test-cli` | CLI entrypoint (`alp-test run`, `alp-test visual`, `alp-test ai`) |
| `@alp/test-core` | Playwright-based runner with glob discovery and reporters |
| `@alp/test-visual` | Screenshot diff using pixelmatch + pngjs with baseline management |
| `@alp/test-ai` | AI test generation stubs and self-healing selector strategies |

## Quickstart

```bash
npm install @alp/test-cli
```

### Video Walkthrough

<div class="video-placeholder" style="text-align:center;padding:20px;border-radius:12px;border:1px solid var(--vp-c-border);background:var(--vp-c-bg-soft);">
  <img src="/videos/alp-test-poster.svg" alt="ALP Test Quickstart" style="max-width:100%;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.2);" />
  <p style="margin-top:12px;color:var(--vp-c-text-2);font-size:0.9rem;">
    Quickstart walkthrough: install &rarr; baseline capture &rarr; test execution in 60 seconds.
  </p>
</div>

## CLI Usage

```bash
# Run test suites
alp-test run --filter "**/*.spec.js"

# Run with visual regression enabled
alp-test run --visual

# Manage visual baselines
alp-test visual --save-baseline home-page
alp-test visual --list

# Generate tests from natural language
alp-test ai "login flow with error states"

# Heal a broken selector
alp-test ai --heal "submit-button"
```

## Visual Regression

```bash
# Save a baseline from the current page
alp-test visual --save-baseline home-page

# Run visual regression against saved baselines
alp-test visual --update
```

Baselines are stored under `.alp-test/baselines/` with diffs in `.alp-test/diff/`.

## AI Test Generation

```bash
# Generate a test plan from a prompt
alp-test ai "checkout flow with promo code"

# Heal a selector using built-in strategies
alp-test ai --heal "login-button"
```

## Library Usage

```js
import { runTests } from "@alp/test-core";
import { runVisualRegression, saveBaseline } from "@alp/test-visual";
import { generateTestsFromPrompt, healSelector } from "@alp/test-ai";

const results = await runTests({ filter: "tests/**/*.spec.js", reporter: "text" });
```

## Integration

- Works with existing Playwright workflows
- Baseline output is git-friendly for PR review
- Designed to plug into ALP CI via `.github/workflows/alp-test.yml`

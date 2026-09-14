export async function generateTestsFromPrompt(prompt, context = {}) {
  const steps = [
    "Navigate to the target page",
    "Assert visible element matches expected text",
    "Capture screenshot for visual baseline",
  ];
  if (context.url) {
    steps.unshift(`goto('${context.url}')`);
  }
  if (context.assertions && context.assertions.length) {
    steps.push(...context.assertions.map((a) => `expect(${a.target}).${a.expectation}`));
  }
  return {
    prompt,
    context,
    generated: [
      {
        title: "AI-generated test",
        steps,
      },
    ],
    note: "Wire to ALP model hub or external LLM provider for real generation.",
  };
}

export async function healSelector(page, selector, fallbackStrategies = []) {
  const strategies = [
    (s) => page.locator(`[data-testid="${s}"]`),
    (s) => page.getByText(s),
    (s) => page.getByLabel(s),
    (s) => page.locator(`[id="${s}"]`),
    (s) => page.locator(`[name="${s}"]`),
    (s) => page.locator(`[aria-label="${s}"]`),
    (s) => page.getByPlaceholder(s),
    ...fallbackStrategies,
  ];
  for (const strategy of strategies) {
    try {
      const locator = strategy(selector);
      const count = await locator.count();
      if (count > 0) return locator.first();
    } catch {
      // continue
    }
  }
  throw new Error(`Unable to heal selector: ${selector}`);
}

export async function generateAndHeal(page, prompt, selector, context = {}) {
  const testPlan = await generateTestsFromPrompt(prompt, context);
  const healedLocator = await healSelector(page, selector);
  return { testPlan, healedLocator };
}

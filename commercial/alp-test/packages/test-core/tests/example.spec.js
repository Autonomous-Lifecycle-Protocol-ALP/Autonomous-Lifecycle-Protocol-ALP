export default async function exampleSmokeTest(page) {
  await page.goto("https://example.com");
  const title = await page.title();
  if (!title.includes("Example")) {
    throw new Error(`Unexpected page title: ${title}`);
  }
}

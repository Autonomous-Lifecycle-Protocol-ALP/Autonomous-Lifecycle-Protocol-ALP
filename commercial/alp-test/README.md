# ALP Test Product Specification
> Auto-generated scaffold for an ALP-native testing product inspired by Playwright + TestSprite.

## Product Position
- **Name**: ALP Test
- **Tagline**: Autonomous testing for autonomous software.
- **Differentiator**: Combines Playwright-class E2E, visual regression, and AI test generation in one protocol-native stack.

## Scope v1
- Multi-language test runner (TypeScript first, Python next)
- Visual regression with pixel-level diff + AI-assisted flake filtering
- AI test authoring from natural language / PR diff
- Unified HTML/CLI reporter with ALP telemetry integration
- CI-ready with GitHub Actions / Render deployment

## Repo Structure
- `packages/test-cli/` — CLI entrypoint (`alp test`, `alp test:visual`, `alp test:ai`)
- `packages/test-core/` — runner, assertions, fixtures, reporters
- `packages/test-visual/` — screenshot diff, baseline management, perceptual diff
- `packages/test-ai/` — AI test generation, self-healing selectors, flake prediction
- `docs/` — product docs
- `tests/` — product self-tests

## Next Steps
1. Initialize package scaffolding
2. Wire root `package.json` workspaces
3. Add landing page section under Product Suite
4. Add GitHub Actions workflow for ALP Test CI

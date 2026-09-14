import fs from 'fs';
import path from 'path';

export interface IntegrateOptions {
  force?: boolean;
  targetDir?: string;
}

const CURSOR_RULES_CONTENT = `# Autonomous Lifecycle Protocol (ALP) Cursor Rules

You are an AI Agent operating within an ALP-managed workspace.

## 1. Context Discovery
- ALWAYS read \`.alp/project.alp\` first to understand the context of the repository.
- If asked to work on a specific feature, read \`.alp/features/<feature-name>.alp\` to understand acceptance criteria and tasks.
- To see the dependency graph of tasks, run \`alp graph\` in the terminal.

## 2. Working on Tasks
- Tasks are represented as \`@task\` blocks in \`.alp\` files.
- Tasks have statuses: \`[ ]\` (Todo), \`[~]\` (In Progress), \`[x]\` (Done), \`[!]\` (Blocked), \`[?]\` (Awaiting human review).
- When beginning work on a task, update its status from \`[ ]\` to \`[~]\`.
- DO NOT begin work on a task if its blocking dependencies are not \`[x]\`.

## 3. Completing Work
- When finishing a task, review its \`@accept\` criteria and run commands in its \`@verify\` block.
- Only if verification passes, update the task's status to \`[x]\`.
- Run \`alp validate\` to ensure changes did not break schema or create cyclic dependencies.

## 4. Execution & Swarms
- Use \`alp run\` to compile context for the next available task. Use \`alp run --concurrent N\` for parallel swarm workers.
- Report progress with \`alp checkpoint <taskId> <status>\`. To request human review, use \`alp checkpoint <taskId> --ask-human "<message>"\`.
`;

const CLAUDE_INSTRUCTIONS_CONTENT = `# ALP Instructions for Claude Code / Cline

This repository is managed by the Autonomous Lifecycle Protocol (ALP). As an autonomous agent, you must synchronize your work with the \`.alp/\` directory.

## Core Directives

1. **Orientation:** Before modifying source code, read \`.alp/project.alp\`. It contains the central goal and architecture rules.
2. **Task Graph:** Work is tracked via \`@task\` blocks. Run \`alp graph\` to view the topological execution order.
3. **Status Sync:** When picking up a task, update status from \`[ ]\` to \`[~]\`. For human approval handoff, set to \`[?]\`.
4. **Validation:** After making changes to \`.alp\` files, run \`alp validate\` to verify schemas and dependency DAG integrity.

## Execution & Checkpoints

- Run \`alp run\` for task context.
- Checkpoint via \`alp checkpoint <taskId> <status>\`.
- Pre-check policy guardrails via \`alp policy --command "..."\` or \`alp policy --path "..."\`.
`;

const GITHUB_VALIDATE_WORKFLOW = `name: "ALP Validate"

on:
  pull_request:
    branches: ["main"]
  push:
    branches: ["main"]

jobs:
  alp_validate:
    name: Validate ALP workspace
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Parser & CLI
        run: |
          npm run build --workspace @autonomous-lifecycle-protocol-alp/parser
          npm run build --workspace @autonomous-lifecycle-protocol-alp/cli

      - name: Validate workspace
        run: npx alp validate
`;

export function integrateCommand(target: string = 'all', options: IntegrateOptions = {}) {
  const baseDir = options.targetDir ? path.resolve(options.targetDir) : process.cwd();
  const normalizedTarget = target.toLowerCase();

  const results: { file: string; created: boolean; skipped: boolean }[] = [];

  const writeFileSafe = (relPath: string, content: string) => {
    const fullPath = path.join(baseDir, relPath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(fullPath) && !options.force) {
      results.push({ file: relPath, created: false, skipped: true });
      return;
    }

    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    results.push({ file: relPath, created: true, skipped: false });
  };

  if (normalizedTarget === 'cursor' || normalizedTarget === 'all') {
    writeFileSafe('.cursorrules', CURSOR_RULES_CONTENT);
  }

  if (normalizedTarget === 'claude' || normalizedTarget === 'cline' || normalizedTarget === 'all') {
    writeFileSafe('CLAUDE.md', CLAUDE_INSTRUCTIONS_CONTENT);
    writeFileSafe('.claudecode.md', CLAUDE_INSTRUCTIONS_CONTENT);
  }

  if (normalizedTarget === 'github' || normalizedTarget === 'all') {
    writeFileSafe('.github/workflows/alp-validate.yml', GITHUB_VALIDATE_WORKFLOW);
  }

  if (results.length === 0) {
    console.error(`[ERROR] Unknown integration target: "${target}". Supported: cursor, claude, github, all`);
    return { success: false, results };
  }

  console.log(`[ALP INTEGRATIONS] Scaffolding for target: ${target}`);
  for (const res of results) {
    if (res.created) {
      console.log(`  [CREATED] ${res.file}`);
    } else if (res.skipped) {
      console.log(`  [SKIPPED] ${res.file} (already exists, use --force to overwrite)`);
    }
  }

  return { success: true, results };
}

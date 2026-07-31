import { Command } from 'commander';
import { AgentCopilot } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerCopilotCommand(program: Command) {
  program
    .command('copilot')
    .description('Adaptive Context-Aware Agent Copilot — intent classification, planning & code generation (v62.0.0)')
    .option('--prompt <text>', 'User prompt or instruction', 'generate a TypeScript async API handler')
    .option('--lang <language>', 'Target language for code suggestion', 'typescript')
    .option('--workspace <id>', 'Workspace ID for context ingestion', 'alp-workspace')
    .action((options) => {
      const copilot = new AgentCopilot();

      // Ingest context
      copilot.ingestContext({
        workspaceId: options.workspace,
        activeFile: 'src/index.ts',
        recentFiles: ['src/policy.ts', 'src/agent-copilot.ts'],
      });

      const intent = copilot.classifyIntent(options.prompt);
      const plan = copilot.generatePlan(options.prompt);
      const suggestion = copilot.suggestCode(options.prompt, options.lang);
      const delegation = copilot.delegateToAgent(options.prompt);

      console.log('\n🤖 Agent Copilot (v62.0.0)');
      console.log('==========================');
      console.log(`  Workspace:      ${options.workspace}`);
      console.log(`  Prompt:         "${options.prompt}"`);
      console.log(`  Intent:         ${intent}`);
      console.log(`  Plan ID:        ${plan.planId}`);
      console.log(`  Plan Steps:     ${plan.steps.length}`);
      plan.steps.forEach(s => {
        console.log(`    [${s.stepIndex}] ${s.action} (${s.agentRole})`);
      });
      console.log(`\n  Code Suggestion (${suggestion.language}):`);
      console.log(`    ${suggestion.code.split('\n').join('\n    ')}`);
      console.log(`\n  Delegation:`);
      console.log(`    Agent:    ${delegation.agentId} (${delegation.agentRole})`);
      console.log(`    Priority: ${delegation.priority}\n`);
    });
}

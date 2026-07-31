import { describe, it, expect } from 'vitest';
import { AgentCopilot } from '../src/agent-copilot';

describe('v62.0.0 AgentCopilot — Adaptive Context-Aware Agent Copilot', () => {
  it('classifies user intents correctly', () => {
    const copilot = new AgentCopilot();

    expect(copilot.classifyIntent('generate a REST API handler')).toBe('CODE_GEN');
    expect(copilot.classifyIntent('refactor this function to be cleaner')).toBe('REFACTOR');
    expect(copilot.classifyIntent('fix the error in the auth module')).toBe('DEBUG');
    expect(copilot.classifyIntent('explain what this code does')).toBe('EXPLAIN');
    expect(copilot.classifyIntent('delegate the deployment task to an agent')).toBe('DELEGATE');
    expect(copilot.classifyIntent('plan the migration strategy')).toBe('PLAN');
  });

  it('generates a multi-step plan with correct structure', () => {
    const copilot = new AgentCopilot();
    const plan = copilot.generatePlan('generate a TypeScript SDK client');

    expect(plan.intent).toBe('CODE_GEN');
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps[0].stepIndex).toBe(0);
    expect(plan.steps[0].agentRole).toBeDefined();
    expect(plan.planId).toContain('copilot-plan-');
  });

  it('produces a code suggestion with correct intent and language', () => {
    const copilot = new AgentCopilot();
    const suggestion = copilot.suggestCode('generate a user auth function', 'typescript');

    expect(suggestion.intent).toBe('CODE_GEN');
    expect(suggestion.language).toBe('typescript');
    expect(suggestion.code).toBeTruthy();
    expect(suggestion.explanation).toContain('CODE_GEN');
  });

  it('delegates to the correct specialized agent based on intent', () => {
    const copilot = new AgentCopilot();

    const debugRoute = copilot.delegateToAgent('fix the null pointer bug');
    expect(debugRoute.agentRole).toBe('Debug Analyst');
    expect(debugRoute.priority).toBe('HIGH');

    const genRoute = copilot.delegateToAgent('generate a payment integration');
    expect(genRoute.agentRole).toBe('Code Generator');
    expect(genRoute.priority).toBe('MEDIUM');
  });

  it('ingests and retrieves workspace context', () => {
    const copilot = new AgentCopilot();
    copilot.ingestContext({ workspaceId: 'ws-alp', activeFile: 'src/index.ts', recentFiles: ['src/policy.ts'] });

    const ctx = copilot.getContext();
    expect(ctx?.workspaceId).toBe('ws-alp');
    expect(ctx?.activeFile).toBe('src/index.ts');
  });
});

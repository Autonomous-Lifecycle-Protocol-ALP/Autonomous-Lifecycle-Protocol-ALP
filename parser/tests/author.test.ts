import { describe, it, expect } from 'vitest';
import { WorkflowAuthor, AuthoringError } from '../src/author';

describe('WorkflowAuthor', () => {
  it('creates rule-based workflow from goal with verbs', () => {
    const author = new WorkflowAuthor();
    const workflow = author.author('Build Test Deploy');
    expect(workflow.id).toBe('build-test-deploy');
    expect(workflow.steps).toHaveLength(3);
    expect(workflow.steps.map((s) => s.action)).toEqual(['Build', 'Test', 'Deploy']);
  });

  it('creates single-step workflow when no verbs found', () => {
    const author = new WorkflowAuthor();
    const workflow = author.author('do the thing');
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.steps[0].action).toBe('do the thing');
  });

  it('throws on empty goal', () => {
    const author = new WorkflowAuthor();
    expect(() => author.author('')).toThrow(AuthoringError);
    expect(() => author.author('   ')).toThrow(AuthoringError);
  });

  it('uses LLM mode when endpoint provided', () => {
    const author = new WorkflowAuthor('http://localhost:11434');
    const workflow = author.author('Deploy to production');
    expect(workflow.steps[0].llm).toBe(true);
    expect(workflow.id).toBe('llm-workflow');
  });

  it('respects custom output prefix', () => {
    const author = new WorkflowAuthor();
    const workflow = author.author('Build', '/tmp/out');
    expect(workflow.out_prefix).toBe('/tmp/out');
  });

  it('generates deterministic workflow ids', () => {
    const author = new WorkflowAuthor();
    const w1 = author.author('Build Test');
    const w2 = author.author('Build Test');
    expect(w1.id).toBe(w2.id);
  });
});

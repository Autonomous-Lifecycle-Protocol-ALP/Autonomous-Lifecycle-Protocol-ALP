import { describe, it, expect } from 'vitest';
import { AlpParser, SwarmMarketplaceEngine } from '../src/index';

function engineFrom() {
  return new SwarmMarketplaceEngine();
}

describe('SwarmMarketplaceEngine (v38.0.0)', () => {
  it('registers a skill and discovers it by category', () => {
    const engine = engineFrom();
    const listing = engine.registerSkill('skill-1', 'agent-a', 'summarize', 'nlp', 0.05, 'Summarize text');

    expect(listing.id).toBe('skill-1');
    expect(listing.providerAgent).toBe('agent-a');
    expect(listing.category).toBe('nlp');
    expect(listing.rating).toBe(5.0);
    expect(listing.totalInvocations).toBe(0);

    const nlpSkills = engine.discoverSkills('nlp');
    expect(nlpSkills).toHaveLength(1);
    expect(nlpSkills[0].id).toBe('skill-1');
  });

  it('discovers all skills when category is omitted', () => {
    const engine = engineFrom();
    engine.registerSkill('s1', 'a', 'x', 'cat1');
    engine.registerSkill('s2', 'b', 'y', 'cat2');

    expect(engine.discoverSkills()).toHaveLength(2);
  });

  it('invokes a skill and records invocation log', () => {
    const engine = engineFrom();
    engine.registerSkill('skill-2', 'agent-b', 'translate', 'nlp');

    const result = engine.invokeSkill('skill-2', 'agent-c', 'hello', () => ({
      output: 'hola',
      latencyMs: 42,
    }));

    expect(result).toBeDefined();
    expect(result!.skillName).toBe('translate');
    expect(result!.callerAgent).toBe('agent-c');
    expect(result!.providerAgent).toBe('agent-b');
    expect(result!.output).toBe('hola');
    expect(result!.latencyMs).toBe(42);
    expect(result!.costCharged).toBeCloseTo(0.01, 2);
    expect(engine.getInvocationLog()).toHaveLength(1);
  });

  it('uses default executor when none is provided', () => {
    const engine = engineFrom();
    engine.registerSkill('skill-3', 'agent-d', 'echo', 'utility');

    const result = engine.invokeSkill('skill-3', 'agent-e', 'ping');

    expect(result).toBeDefined();
    expect(result!.output).toContain('echo');
    expect(result!.output).toContain('ping');
    expect(result!.latencyMs).toBe(85);
  });

  it('returns undefined when invoking an unknown listing', () => {
    const engine = engineFrom();
    expect(engine.invokeSkill('missing', 'agent-x', 'input')).toBeUndefined();
  });

  it('rates a skill with clamped average', () => {
    const engine = engineFrom();
    const listing = engine.registerSkill('skill-4', 'agent-f', 'rate-me', 'test');

    expect(engine.rateSkill('skill-4', 3)).toBe(true);
    expect(listing.rating).toBeCloseTo(4.0, 1);

    expect(engine.rateSkill('missing', 5)).toBe(false);
  });

  it('increments invocation count over multiple calls', () => {
    const engine = engineFrom();
    engine.registerSkill('skill-5', 'agent-g', 'count', 'test');

    engine.invokeSkill('skill-5', 'a', '1');
    engine.invokeSkill('skill-5', 'b', '2');

    const log = engine.getInvocationLog();
    expect(log).toHaveLength(2);
    expect(log[0].listingId).toBe('skill-5');
    expect(log[1].callerAgent).toBe('b');
  });

  it('retrieves a listing by id', () => {
    const engine = engineFrom();
    engine.registerSkill('skill-6', 'agent-h', 'find-me', 'test');

    const found = engine.getListing('skill-6');
    expect(found).toBeDefined();
    expect(found!.skillName).toBe('find-me');
    expect(engine.getListing('missing')).toBeUndefined();
  });
});

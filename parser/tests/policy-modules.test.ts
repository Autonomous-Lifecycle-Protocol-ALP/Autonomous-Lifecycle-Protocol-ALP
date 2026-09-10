import { describe, it, expect, beforeEach } from 'vitest';
import {
  globToRegExp,
  normalizeRef,
  normalizePath,
  applyPair,
  parseProposalLiteral,
  normalizeObjects,
} from '../src/policy/utils';
import { PolicyLearner } from '../src/policy/learner';
import { PolicyEngine } from '../src/policy/engine';
import type { PolicyContext, PolicyQuery } from '../src/policy/types';

describe('policy/utils', () => {
  describe('globToRegExp', () => {
    it('converts ** to match across separators', () => {
      const re = globToRegExp('**/test/**');
      expect(re.test('foo/test/bar')).toBe(true);
      expect(re.test('test/bar')).toBe(true);
      expect(re.test('foo/bar/test/baz')).toBe(true);
      expect(re.test('foo/bar')).toBe(false);
    });

    it('converts * to match within segment', () => {
      const re = globToRegExp('src/*.ts');
      expect(re.test('src/foo.ts')).toBe(true);
      expect(re.test('src/bar.ts')).toBe(true);
      expect(re.test('src/sub/foo.ts')).toBe(false);
      expect(re.test('src/foo.js')).toBe(false);
    });

    it('converts ? to match single char', () => {
      const re = globToRegExp('file?.txt');
      expect(re.test('file1.txt')).toBe(true);
      expect(re.test('fileA.txt')).toBe(true);
      expect(re.test('file12.txt')).toBe(false);
      expect(re.test('file.txt')).toBe(false);
    });

    it('escapes special regex chars', () => {
      const re = globToRegExp('file[1].txt');
      expect(re.test('file[1].txt')).toBe(true);
      expect(re.test('file1.txt')).toBe(false);
    });

    it('anchors regex (^ and $)', () => {
      const re = globToRegExp('test');
      expect(re.test('test')).toBe(true);
      expect(re.test('prefix_test')).toBe(false);
      expect(re.test('test_suffix')).toBe(false);
    });

    it('handles **/ pattern with trailing slash', () => {
      const re = globToRegExp('**/src/');
      expect(re.test('foo/src/')).toBe(true);
      expect(re.test('src/')).toBe(true);
    });
  });

  describe('normalizeRef', () => {
    it('strips "-> " prefix', () => {
      expect(normalizeRef('-> agent-1')).toBe('agent-1');
      expect(normalizeRef('->  agent-2')).toBe('agent-2');
    });

    it('trims whitespace', () => {
      expect(normalizeRef('  agent-1  ')).toBe('agent-1');
      expect(normalizeRef('->   agent-1   ')).toBe('agent-1');
    });

    it('handles no prefix', () => {
      expect(normalizeRef('agent-1')).toBe('agent-1');
    });
  });

  describe('normalizePath', () => {
    it('replaces backslashes with forward slashes', () => {
      expect(normalizePath('foo\\bar\\baz')).toBe('foo/bar/baz');
    });

    it('strips leading ./', () => {
      expect(normalizePath('./foo/bar')).toBe('foo/bar');
      expect(normalizePath('.\\foo\\bar')).toBe('foo/bar');
    });

    it('handles mixed separators', () => {
      expect(normalizePath('.\\foo/bar\\baz')).toBe('foo/bar/baz');
    });

    it('handles no changes needed', () => {
      expect(normalizePath('foo/bar')).toBe('foo/bar');
    });
  });

  describe('applyPair', () => {
    it('parses key: value', () => {
      const out: Record<string, any> = {};
      applyPair('key: value', out);
      expect(out).toEqual({ key: 'value' });
    });

    it('strips double quotes from value', () => {
      const out: Record<string, any> = {};
      applyPair('key: "value"', out);
      expect(out).toEqual({ key: 'value' });
    });

    it('strips single quotes from value', () => {
      const out: Record<string, any> = {};
      applyPair("key: 'value'", out);
      expect(out).toEqual({ key: 'value' });
    });

    it('trims key and value', () => {
      const out: Record<string, any> = {};
      applyPair('  key  :  value  ', out);
      expect(out).toEqual({ key: 'value' });
    });

    it('does nothing if no colon', () => {
      const out: Record<string, any> = {};
      applyPair('invalid', out);
      expect(out).toEqual({});
    });

    it('handles empty value', () => {
      const out: Record<string, any> = {};
      applyPair('key:', out);
      expect(out).toEqual({ key: '' });
    });
  });

  describe('parseProposalLiteral', () => {
    it('parses simple object', () => {
      const result = parseProposalLiteral('{ id: "prop-1", name: "test" }');
      expect(result).toEqual({ id: 'prop-1', name: 'test' });
    });

    it('handles bracket-aware comma separation', () => {
      const result = parseProposalLiteral('{ id: "prop-1", days: ["mon","tue"], nested: { a: 1 } }');
      expect(result.id).toBe('prop-1');
      expect(result.days).toBe('["mon","tue"]');
      expect(result.nested).toBe('{ a: 1 }');
    });

    it('handles empty object', () => {
      const result = parseProposalLiteral('{}');
      expect(result).toEqual({});
    });

    it('handles whitespace', () => {
      const result = parseProposalLiteral('  { id: "x" }  ');
      expect(result).toEqual({ id: 'x' });
    });
  });

  describe('normalizeObjects', () => {
    it('maps string items through parseProposalLiteral', () => {
      const list = ['{ id: "a" }', '{ id: "b" }'];
      const result = normalizeObjects(list);
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it('passes through already-parsed objects', () => {
      const list = [{ id: 'a' }, { id: 'b' }];
      const result = normalizeObjects(list);
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it('handles mixed array', () => {
      const list = ['{ id: "a" }', { id: 'b' }];
      const result = normalizeObjects(list);
      expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it('returns empty array for undefined', () => {
      expect(normalizeObjects(undefined)).toEqual([]);
    });

    it('returns empty array for non-array', () => {
      expect(normalizeObjects('not array' as any)).toEqual([]);
    });
  });
});

describe('PolicyLearner', () => {
  let learner: PolicyLearner;
  const baseContext: PolicyContext = {
    kind: 'path',
    value: '/test/path',
  };

  beforeEach(() => {
    learner = new PolicyLearner();
  });

  it('records violations', () => {
    learner.recordViolation('policy-1', 'read', false, baseContext);
    learner.recordViolation('policy-1', 'write', true, baseContext);
    learner.recordViolation('policy-2', 'execute', false, baseContext);
  });

  it('suggests review when denied count >= 3', () => {
    learner.recordViolation('policy-1', 'read', false, baseContext);
    learner.recordViolation('policy-1', 'write', false, baseContext);
    learner.recordViolation('policy-1', 'execute', false, baseContext);

    const suggestions = learner.suggest();
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].policy_id).toBe('policy-1');
    expect(suggestions[0].action).toBe('review_allow_rules');
    expect(suggestions[0].confidence).toBeGreaterThan(0.5);
    expect(suggestions[0].confidence).toBeLessThanOrEqual(0.95);
  });

  it('does not suggest when denied count < 3', () => {
    learner.recordViolation('policy-1', 'read', false, baseContext);
    learner.recordViolation('policy-1', 'write', false, baseContext);

    const suggestions = learner.suggest();
    expect(suggestions).toHaveLength(0);
  });

  it('does not suggest for allowed violations', () => {
    learner.recordViolation('policy-1', 'read', true, baseContext);
    learner.recordViolation('policy-1', 'write', true, baseContext);
    learner.recordViolation('policy-1', 'execute', true, baseContext);

    const suggestions = learner.suggest();
    expect(suggestions).toHaveLength(0);
  });

  it('handles multiple policies independently', () => {
    learner.recordViolation('policy-1', 'read', false, baseContext);
    learner.recordViolation('policy-1', 'write', false, baseContext);
    learner.recordViolation('policy-1', 'execute', false, baseContext);
    learner.recordViolation('policy-2', 'read', false, baseContext);
    learner.recordViolation('policy-2', 'write', false, baseContext);

    const suggestions = learner.suggest();
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].policy_id).toBe('policy-1');
  });

  it('resets violations', () => {
    learner.recordViolation('policy-1', 'read', false, baseContext);
    learner.recordViolation('policy-1', 'write', false, baseContext);
    learner.recordViolation('policy-1', 'execute', false, baseContext);
    learner.reset();

    const suggestions = learner.suggest();
    expect(suggestions).toHaveLength(0);
  });

  it('confidence increases with more denials', () => {
    learner.recordViolation('policy-1', 'a', false, baseContext);
    learner.recordViolation('policy-1', 'b', false, baseContext);
    learner.recordViolation('policy-1', 'c', false, baseContext);
    let suggestions = learner.suggest();
    expect(suggestions[0].confidence).toBe(0.8);

    learner.recordViolation('policy-1', 'd', false, baseContext);
    suggestions = learner.suggest();
    expect(suggestions[0].confidence).toBe(0.9);

    learner.recordViolation('policy-1', 'e', false, baseContext);
    suggestions = learner.suggest();
    expect(suggestions[0].confidence).toBe(0.95);
  });
});

describe('PolicyEngine', () => {
  it('constructs with empty array', () => {
    const engine = new PolicyEngine([]);
    expect(engine.count).toBe(0);
  });

  it('evaluate allows everything with no policies', () => {
    const engine = new PolicyEngine([]);
    const query: PolicyQuery = { kind: 'path', value: '/any/path', agent: 'agent-1' };
    const decision = engine.evaluate(query);

    expect(decision.allowed).toBe(true);
    expect(decision.blocked).toBe(false);
    expect(decision.reasons).toHaveLength(0);
    expect(decision.policies).toHaveLength(0);
    expect(decision.requiresApproval).toBe(false);
  });

  it('evaluateDenyOnly allows everything with no policies', () => {
    const engine = new PolicyEngine([]);
    const query: PolicyQuery = { kind: 'command', value: 'rm -rf /', agent: 'agent-1' };
    const decision = engine.evaluateDenyOnly(query);

    expect(decision.allowed).toBe(true);
    expect(decision.blocked).toBe(false);
  });

  describe('versioning', () => {
    it('versionPolicy creates snapshot', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict' }]);
      const version = engine.versionPolicy('test-policy', 'v1.0.0');

      expect(version).toBeDefined();
      expect(version?.version).toBe('v1.0.0');
      expect(version?.policy.id).toBe('test-policy');
    });

    it('versionPolicy returns undefined for unknown policy', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict' }]);
      const version = engine.versionPolicy('unknown-policy', 'v1.0.0');
      expect(version).toBeUndefined();
    });

    it('getVersions returns list of versions', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict' }]);
      engine.versionPolicy('test-policy', 'v1.0.0');
      engine.versionPolicy('test-policy', 'v1.1.0');
      engine.versionPolicy('test-policy', 'v2.0.0');

      const versions = engine.getVersions('test-policy');
      expect(versions).toHaveLength(3);
      expect(versions.map(v => v.version)).toEqual(['v1.0.0', 'v1.1.0', 'v2.0.0']);
    });

    it('getVersions returns empty for unknown policy', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict' }]);
      const versions = engine.getVersions('unknown-policy');
      expect(versions).toHaveLength(0);
    });

    it('rollback restores previous version', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict', allow_paths: ['/old'] }]);
      engine.versionPolicy('test-policy', 'v1.0.0');

      // Modify policy (simulate change)
      const policyObj = (engine as any).policies.find((p: any) => p.id === 'test-policy');
      policyObj.allow_paths = ['/new'];
      engine.versionPolicy('test-policy', 'v2.0.0');

      // Rollback to v1.0.0
      const rollback = engine.rollback('test-policy', 'v1.0.0');
      expect(rollback).toBeDefined();
      expect(rollback?.from_version).toBe('v2.0.0');
      expect(rollback?.to_version).toBe('v1.0.0');

      const policy = (engine as any).policies.find((p: any) => p.id === 'test-policy');
      expect(policy.allow_paths).toEqual(['/old']);
    });

    it('rollback returns undefined for unknown version', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict' }]);
      engine.versionPolicy('test-policy', 'v1.0.0');

      const rollback = engine.rollback('test-policy', 'v99.0.0');
      expect(rollback).toBeUndefined();
    });

    it('getRollbacks returns rollback history', () => {
      const engine = new PolicyEngine([{ _type: 'policy', id: 'test-policy', applies_to: '*', enforcement: 'strict', allow_paths: ['/old'] }]);
      engine.versionPolicy('test-policy', 'v1.0.0');

      const policyObj = (engine as any).policies.find((p: any) => p.id === 'test-policy');
      policyObj.allow_paths = ['/new'];
      engine.versionPolicy('test-policy', 'v2.0.0');

      engine.rollback('test-policy', 'v1.0.0');

      const rollbacks = engine.getRollbacks('test-policy');
      expect(rollbacks).toHaveLength(1);
      expect(rollbacks[0].from_version).toBe('v2.0.0');
      expect(rollbacks[0].to_version).toBe('v1.0.0');
    });

    it('getRollbacks filters by policy_id', () => {
      const engine = new PolicyEngine([
        { _type: 'policy', id: 'policy-a', applies_to: '*', enforcement: 'strict' },
        { _type: 'policy', id: 'policy-b', applies_to: '*', enforcement: 'strict' },
      ]);
      engine.versionPolicy('policy-a', 'v1.0.0');
      engine.versionPolicy('policy-b', 'v1.0.0');

      const policyA = (engine as any).policies.find((p: any) => p.id === 'policy-a');
      policyA.allow_paths = ['/new-a'];
      engine.versionPolicy('policy-a', 'v2.0.0');
      engine.rollback('policy-a', 'v1.0.0');

      const rollbacksA = engine.getRollbacks('policy-a');
      const rollbacksB = engine.getRollbacks('policy-b');

      expect(rollbacksA).toHaveLength(1);
      expect(rollbacksB).toHaveLength(0);
    });
  });
});
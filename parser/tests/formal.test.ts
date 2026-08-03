import { describe, it, expect } from 'vitest';
import { PolicyModelChecker, ContractInvariant } from '../src/formal';

function makeObject(type: string, id: string, overrides: Record<string, any> = {}) {
  return { _type: type, id, ...overrides };
}

describe('PolicyModelChecker', () => {
  it('returns failed proof when policy not found', () => {
    const checker = new PolicyModelChecker([]);
    const proof = checker.verify('missing-policy');
    expect(proof.passed).toBe(false);
    expect(proof.counterexample?.invariant).toBe('policy_exists');
  });

  it('passes a valid strict policy', () => {
    const policy = makeObject('policy', 'p1', {
      enforcement: 'strict',
      allow_paths: ['src/**'],
      deny_paths: ['src/secrets/**'],
      allow_commands: ['npm test'],
      deny_commands: ['rm -rf /'],
      allow_during: [{ days: ['mon', 'tue'], start: '09:00', end: '17:00' }],
      applies_to: '*',
    });
    const checker = new PolicyModelChecker([policy]);
    const proof = checker.verify('p1');
    expect(proof.passed).toBe(true);
    expect(proof.properties.every((p) => p.passed)).toBe(true);
  });

  it('detects allow/deny path contradiction', () => {
    const policy = makeObject('policy', 'p1', {
      enforcement: 'strict',
      allow_paths: ['src/**', 'src/secrets/**'],
      deny_paths: ['src/secrets/**'],
      allow_commands: [],
      deny_commands: [],
      allow_during: [],
      applies_to: '*',
    });
    const checker = new PolicyModelChecker([policy]);
    const proof = checker.verify('p1');
    expect(proof.passed).toBe(false);
    expect(proof.properties.find((p) => p.name === 'no_path_contradiction')?.passed).toBe(false);
  });

  it('detects allow/deny command contradiction', () => {
    const policy = makeObject('policy', 'p1', {
      enforcement: 'strict',
      allow_paths: [],
      deny_paths: [],
      allow_commands: ['npm test'],
      deny_commands: ['npm test'],
      allow_during: [],
      applies_to: '*',
    });
    const checker = new PolicyModelChecker([policy]);
    const proof = checker.verify('p1');
    expect(proof.properties.find((p) => p.name === 'no_command_contradiction')?.passed).toBe(false);
  });

  it('detects invalid time window', () => {
    const policy = makeObject('policy', 'p1', {
      enforcement: 'strict',
      allow_paths: [],
      deny_paths: [],
      allow_commands: [],
      deny_commands: [],
      allow_during: [{ days: [], start: '09:00', end: '17:00' }],
      applies_to: '*',
    });
    const checker = new PolicyModelChecker([policy]);
    const proof = checker.verify('p1');
    expect(proof.properties.find((p) => p.name === 'valid_time_windows')?.passed).toBe(false);
  });

  it('rejects invalid enforcement value', () => {
    const policy = makeObject('policy', 'p1', {
      enforcement: 'invalid',
      allow_paths: [],
      deny_paths: [],
      allow_commands: [],
      deny_commands: [],
      allow_during: [],
      applies_to: '*',
    });
    const checker = new PolicyModelChecker([policy]);
    const proof = checker.verify('p1');
    expect(proof.properties.find((p) => p.name === 'valid_enforcement')?.passed).toBe(false);
  });
});

describe('ContractInvariant', () => {
  it('returns failed proof when contract not found', () => {
    const checker = new ContractInvariant([]);
    const proof = checker.verifyContract('missing-contract');
    expect(proof.passed).toBe(false);
    expect(proof.counterexample?.invariant).toBe('contract_exists');
  });

  it('passes a valid contract', () => {
    const contract = makeObject('contract', 'c1', {
      type: 'api',
      requires: ['user must be authenticated'],
      allows: ['GET /api/users'],
      denies: ['DELETE /api/users'],
      on_violation: 'deny',
    });
    const checker = new ContractInvariant([contract]);
    const proof = checker.verifyContract('c1');
    expect(proof.passed).toBe(true);
  });

  it('detects invalid on_violation', () => {
    const contract = makeObject('contract', 'c1', {
      type: 'api',
      requires: [],
      allows: [],
      denies: [],
      on_violation: 'invalid',
    });
    const checker = new ContractInvariant([contract]);
    const proof = checker.verifyContract('c1');
    expect(proof.properties.find((p) => p.name === 'valid_on_violation')?.passed).toBe(false);
  });
});

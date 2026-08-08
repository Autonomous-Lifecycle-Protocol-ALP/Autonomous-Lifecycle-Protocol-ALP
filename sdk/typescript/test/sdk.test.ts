import { describe, it, expect } from 'vitest';
import { AlpWorkspace, PolicyEnforcer, DocumentValidator } from '../src/index';

describe('@autonomous-lifecycle-protocol-alp/sdk — AlpWorkspace', () => {
  const workspace = new AlpWorkspace();
  workspace.load('examples/todo-app');

  it('should load all .alp objects (including nested feature files)', () => {
    expect(workspace.objects.length).toBeGreaterThan(0);
    expect(workspace.findById('todo-app')).toBeDefined();
    // Nested files (features/, worklows/) must be discovered too.
    expect(workspace.findById('feat-user-auth')).toBeDefined();
  });

  it('should build a dependency graph with no cycles', () => {
    const order = workspace.getExecutionOrder();
    expect(order.length).toBe(workspace.objects.length);
  });

  it('should topologically order dependencies before dependents', () => {
    const order = workspace.getExecutionOrder().map((n) => n.id);
    // feat-task-management depends_on feat-user-auth, so the dependency
    // (feat-user-auth) must appear before its dependent (feat-task-management).
    const depIdx = order.indexOf('feat-user-auth');
    const dependentIdx = order.indexOf('feat-task-management');
    expect(depIdx).toBeGreaterThanOrEqual(0);
    expect(dependentIdx).toBeGreaterThanOrEqual(0);
    expect(depIdx).toBeLessThan(dependentIdx);
  });
});

describe('PolicyEnforcer', () => {
  it('should pass a valid document with required fields', () => {
    const enforcer = new PolicyEnforcer({ requiredFields: ['id', 'type'] });
    expect(enforcer.enforce({ id: 'a-1', type: 'agent', desc: 'test' })).toBe(true);
  });

  it('should fail when a required field is missing', () => {
    const enforcer = new PolicyEnforcer({ requiredFields: ['id', 'type'] });
    expect(enforcer.enforce({ id: 'a-1' })).toBe(false);
  });

  it('should deny blocked types', () => {
    const enforcer = new PolicyEnforcer({ denyTypes: ['raw_sql'] });
    expect(enforcer.enforce({ id: 'q-1', _type: 'raw_sql' })).toBe(false);
  });

  it('should allow non-denied types', () => {
    const enforcer = new PolicyEnforcer({ denyTypes: ['raw_sql'] });
    expect(enforcer.enforce({ id: 't-1', _type: 'task' })).toBe(true);
  });

  it('should reject non-object input', () => {
    const enforcer = new PolicyEnforcer();
    expect(enforcer.enforce(null as any)).toBe(false);
  });

  it('should pass with no rules configured', () => {
    const enforcer = new PolicyEnforcer();
    expect(enforcer.enforce({ id: 'x', type: 'agent' })).toBe(true);
  });

  it('govern() should scan workspace objects', () => {
    const workspace = new AlpWorkspace();
    workspace.load('examples/todo-app');
    const enforcer = new PolicyEnforcer({ requiredFields: ['_type', 'id'] });
    const result = enforcer.govern(workspace);
    expect(result.objectsScanned).toBe(workspace.objects.length);
    expect(typeof result.compliant).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });
});

describe('DocumentValidator', () => {
  it('should validate a well-formed document', () => {
    const v = new DocumentValidator();
    expect(v.validate({ _type: 'agent', id: 'a-1' })).toBe(true);
  });

  it('should throw on missing type', () => {
    const v = new DocumentValidator();
    expect(() => v.validate({ id: 'x' })).toThrow("'_type' or 'type'");
  });

  it('should throw on missing id', () => {
    const v = new DocumentValidator();
    expect(() => v.validate({ _type: 'agent' })).toThrow("'id'");
  });

  it('should throw on non-object', () => {
    const v = new DocumentValidator();
    expect(() => v.validate(null as any)).toThrow('must be an object');
  });

  it('strict mode rejects unknown block types', () => {
    const v = new DocumentValidator({ strict: true });
    expect(() => v.validate({ _type: 'exotic', id: 'x' })).toThrow('Unknown block type');
  });

  it('strict mode allows known block types', () => {
    const v = new DocumentValidator({ strict: true });
    expect(v.validate({ _type: 'agent', id: 'a-1' })).toBe(true);
  });

  it('should accept id from properties sub-object', () => {
    const v = new DocumentValidator();
    expect(v.validate({ _type: 'task', properties: { id: 'task-1' } })).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { AlpParser, MacroEngine } from '../src/index';

function engineFrom() {
  return new MacroEngine();
}

describe('MacroEngine (v37.0.0)', () => {
  it('expands a macro over a JSON array', () => {
    const src = `
@macro
  id: macro-users
  iterate_over: ["alice", "bob"]
  as: name
  template:
    _type: task
    id: task-\${name}
    title: "Task for \${name}"
`;
    const parser = new AlpParser();
    const objects = parser.parse(src);
    const engine = engineFrom();
    const expanded = engine.expandAll(objects);

    expect(expanded).toHaveLength(2);
    expect(expanded[0].id).toBe('task-alice');
    expect(expanded[0].title).toBe('Task for alice');
    expect(expanded[1].id).toBe('task-bob');
    expect(expanded[1].title).toBe('Task for bob');
    expect(expanded[0]._sourceMacro).toBe('macro-users');
  });

  it('expands a macro over an ALPEL expression', () => {
    const src = `
@macro
  id: macro-envs
  iterate_over: '["dev", "staging", "prod"]'
  as: env
  template:
    _type: task
    id: task-deploy-\${env}
    title: "Deploy to \${env}"
`;
    const parser = new AlpParser();
    const objects = parser.parse(src);
    const engine = engineFrom();
    const expanded = engine.expandAll(objects);

    expect(expanded).toHaveLength(3);
    expect(expanded.map((o: any) => o.id)).toEqual([
      'task-deploy-dev',
      'task-deploy-staging',
      'task-deploy-prod',
    ]);
  });

  it('throws when iterate_over is missing', () => {
    const engine = engineFrom();
    expect(() =>
      engine.expand({ id: 'bad', template: { _type: 'task', id: 'x' } } as any),
    ).toThrow("missing iterate_over");
  });

  it('throws when template is missing', () => {
    const engine = engineFrom();
    expect(() =>
      engine.expand({ id: 'bad', iterate_over: '[]' } as any),
    ).toThrow("missing template");
  });

  it('detects duplicate generated ids', () => {
    const src = `
@macro
  id: macro-dup
  iterate_over: [1, 1]
  as: n
  template:
    _type: task
    id: task-same
    title: "\${n}"
`;
    const parser = new AlpParser();
    const objects = parser.parse(src);
    const engine = engineFrom();
    expect(() => engine.expandAll(objects)).toThrow("duplicate generated id 'task-same'");
  });

  it('passes through non-macro objects unchanged', () => {
    const src = `
@task
  id: task-static
  title: "Static task"
@macro
  id: macro-dynamic
  iterate_over: [1]
  as: n
  template:
    _type: task
    id: task-\${n}
`;
    const parser = new AlpParser();
    const objects = parser.parse(src);
    const engine = engineFrom();
    const expanded = engine.expandAll(objects);

    expect(expanded).toHaveLength(2);
    expect(expanded[0].id).toBe('task-static');
    expect(expanded[1].id).toBe('task-1');
    expect(expanded[1]._sourceMacro).toBe('macro-dynamic');
  });

  it('interpolates dotted property keys', () => {
    const src = `
@macro
  id: macro-nested
  iterate_over: [{"user":"alice"}]
  as: item
  template:
    _type: task
    id: task-\${item.user}
    meta.title: "\${item.user}'s task"
`;
    const parser = new AlpParser();
    const objects = parser.parse(src);
    const engine = engineFrom();
    const expanded = engine.expandAll(objects);

    expect(expanded).toHaveLength(1);
    expect(expanded[0].id).toBe('task-alice');
    expect((expanded[0] as any)['meta.title']).toBe("alice's task");
  });
});

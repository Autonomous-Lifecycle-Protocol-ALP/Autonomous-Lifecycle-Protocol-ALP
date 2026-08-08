import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';
import { DocumentValidator, PolicyEnforcer } from '@autonomous-lifecycle-protocol-alp/sdk';

describe('VS Code Language Server & Governance Integration', () => {
  it('validates document syntax and runs DocumentValidator', () => {
    const text = `!alp-version: 3.0.0

@task
  id: task-build-auth
  status: [ ]
  description: "Build OAuth authentication service"
`;
    const doc = TextDocument.create('file:///test.alp', 'alp', 1, text);
    const parser = new AlpParser();
    const objects = parser.parse(doc.getText());
    expect(objects.length).toBe(1);
    expect(objects[0].id).toBe('task-build-auth');

    const validator = new DocumentValidator();
    expect(validator.validate({ _type: objects[0]._type, id: objects[0].id })).toBe(true);
  });

  it('runs PolicyEnforcer workspace governance checks', () => {
    const objects = [
      { _type: 'agent', id: 'agent-qa', description: 'QA Agent' },
      { _type: 'task', id: 'task-1', description: 'Run test suite' },
    ];
    const enforcer = new PolicyEnforcer({ requiredFields: ['id', '_type'] });
    const result = enforcer.govern({ objects } as any);
    expect(result.compliant).toBe(true);
    expect(result.objectsScanned).toBe(2);
    expect(result.violations.length).toBe(0);
  });

  it('detects policy violations on non-compliant objects', () => {
    const objects = [
      { type: 'raw_sql', id: 'query-1' },
    ];
    const enforcer = new PolicyEnforcer({ denyTypes: ['raw_sql'] });
    const result = enforcer.govern({ objects } as any);
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('query-1');
  });
});

describe('Deprecation Directive Detection', () => {
  it('detects !deprecated directives in parsed content', () => {
    const text = `@task
  id: legacy-auth
  !deprecated: Use task-build-auth-v2 instead
  description: "Legacy auth module"
`;
    const lines = text.split('\n');
    const deprecatedLines: { line: number; message: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s+(!deprecated):\s*(.*)$/);
      if (match) {
        deprecatedLines.push({ line: i, message: match[2] });
      }
    }

    expect(deprecatedLines.length).toBe(1);
    expect(deprecatedLines[0].message).toBe('Use task-build-auth-v2 instead');
  });
});

describe('Status Marker Validation', () => {
  it('detects [!] without reason', () => {
    const line = '  status: [!]';
    const match = line.match(/\[!\](?!\s+\S)/);
    expect(match).not.toBeNull();
  });

  it('accepts [!] with reason', () => {
    const line = '  status: [!] waiting for dependency';
    const match = line.match(/\[!\](?!\s+\S)/);
    expect(match).toBeNull();
  });

  it('detects [?] without reason', () => {
    const line = '  status: [?]';
    const match = line.match(/\[\?\](?!\s+\S)/);
    expect(match).not.toBeNull();
  });

  it('accepts [?] with reason', () => {
    const line = '  status: [?] awaiting human approval';
    const match = line.match(/\[\?\](?!\s+\S)/);
    expect(match).toBeNull();
  });
});

describe('Reference Resolution', () => {
  it('extracts reference IDs from -> operator', () => {
    const line = '  depends_on: -> task-build-auth';
    const match = line.match(/->\s+([a-zA-Z0-9_-]+)/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('task-build-auth');
  });

  it('handles lines without references', () => {
    const line = '  description: "No reference here"';
    const match = line.match(/->\s+([a-zA-Z0-9_-]+)/);
    expect(match).toBeNull();
  });
});

describe('Completion Provider Logic', () => {
  it('suggests block types when cursor follows @', () => {
    const textBeforeCursor = '@';
    const isBlockContext = textBeforeCursor.match(/^@$/);
    expect(isBlockContext).not.toBeNull();
  });

  it('suggests references when cursor follows ->', () => {
    const textBeforeCursor = '  depends_on: -> ';
    const isRefContext = textBeforeCursor.match(/->\s*$/);
    expect(isRefContext).not.toBeNull();
  });

  it('does not suggest block types mid-line', () => {
    const textBeforeCursor = '  description: "using @mention"';
    const isBlockContext = textBeforeCursor.match(/^@$/);
    expect(isBlockContext).toBeNull();
  });
});

describe('Multi-Object Document Parsing', () => {
  it('parses multiple objects from single document', () => {
    const text = `@agent
  id: agent-dev
  model: "gpt-4"

@task
  id: task-1
  status: [ ]
  agent: -> agent-dev

@policy
  id: policy-no-raw
  enforcement: deny
`;
    const parser = new AlpParser();
    const objects = parser.parse(text);
    expect(objects.length).toBe(3);
    expect(objects.map((o: any) => o._type)).toEqual(['agent', 'task', 'policy']);
  });

  it('validates all objects with DocumentValidator', () => {
    const objects = [
      { _type: 'agent', id: 'agent-1' },
      { _type: 'task', id: 'task-1' },
      { _type: 'policy', id: 'policy-1' },
    ];
    const validator = new DocumentValidator();
    for (const obj of objects) {
      expect(validator.validate({ _type: obj._type, id: obj.id })).toBe(true);
    }
  });
});

describe('PolicyEnforcer Edge Cases', () => {
  it('handles empty object list', () => {
    const enforcer = new PolicyEnforcer({ requiredFields: ['id'] });
    const result = enforcer.govern({ objects: [] } as any);
    expect(result.compliant).toBe(true);
    expect(result.objectsScanned).toBe(0);
  });

  it('enforces multiple deny types', () => {
    const objects = [
      { type: 'raw_sql', id: 'q1' },
      { type: 'unsafe_exec', id: 'e1' },
      { type: 'task', id: 't1' },
    ];
    const enforcer = new PolicyEnforcer({ denyTypes: ['raw_sql', 'unsafe_exec'] });
    const result = enforcer.govern({ objects } as any);
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('q1');
    expect(result.violations).toContain('e1');
    expect(result.violations).not.toContain('t1');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Linter, LintDiagnostic } from '../src/linter';

function makeAlpDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-linter-'));
  fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
  return tmp;
}

describe('Linter (v42.0.0)', () => {
  it('detects non-kebab-case IDs', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 'bad.alp'), `
@task
  id: Bad_ID
  description: "A task with bad ID"
`);
      const linter = new Linter();
      const results = linter.lintDirectory(path.join(tmp, '.alp'));
      const diags = results[0]?.diagnostics ?? [];
      expect(diags.some((d: LintDiagnostic) => d.rule === 'kebab-case-id')).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('warns on missing description', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: t1
`);
      const linter = new Linter();
      const results = linter.lintDirectory(path.join(tmp, '.alp'));
      const diags = results[0]?.diagnostics ?? [];
      expect(diags.some((d: LintDiagnostic) => d.rule === 'required-description')).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('warns on short descriptions', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: t1
  description: "short"
`);
      const linter = new Linter();
      const results = linter.lintDirectory(path.join(tmp, '.alp'));
      const diags = results[0]?.diagnostics ?? [];
      expect(diags.some((d: LintDiagnostic) => d.rule === 'description-length')).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('warns on tasks without verify gates', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: t1
  description: "A task"
`);
      const linter = new Linter();
      const results = linter.lintDirectory(path.join(tmp, '.alp'));
      const diags = results[0]?.diagnostics ?? [];
      expect(diags.some((d: LintDiagnostic) => d.rule === 'task-verify')).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns empty diagnostics for clean files', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: t1
  description: "A well-formed task with enough characters"
  verify:
    - "tests pass"
`);
      const linter = new Linter();
      const results = linter.lintDirectory(path.join(tmp, '.alp'));
      expect(results).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('supports custom rules', () => {
    const linter = new Linter();
    linter.addRule({
      name: 'custom-rule',
      description: 'A custom test rule',
      severity: 'error',
      check: (obj) => {
        if (obj._type === 'task' && obj.id === 'forbidden') {
          return { rule: 'custom-rule', severity: 'error', message: 'forbidden id', file: '' };
        }
        return null;
      },
    });
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: forbidden
  description: "A task"
`);
      const results = linter.lintDirectory(path.join(tmp, '.alp'));
      expect(results[0]?.diagnostics.some((d: LintDiagnostic) => d.rule === 'custom-rule')).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

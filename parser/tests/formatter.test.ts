import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AlpFormatter } from '../src/formatter';

describe('AlpFormatter (v42.0.0)', () => {
  const formatter = new AlpFormatter({ indentSize: 2 });

  it('formats a simple ALP block', () => {
    const input = `@task\n  id: t1\n  description: "hello"\n`;
    const output = formatter.format(input);
    expect(output).toContain('@task');
    expect(output).toContain('id: t1');
    expect(output).toContain('description: "hello"');
  });

  it('preserves directives', () => {
    const input = `!alp-version: 3.1.0\n\n@task\n  id: t1\n`;
    const output = formatter.format(input);
    expect(output).toContain('!alp-version: 3.1.0');
    expect(output).toContain('@task');
  });

  it('formats workspace files and returns changed files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-format-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `@task\nid: t1\ndescription: "hello"\n`);
      const results = formatter.formatWorkspace(path.join(tmp, '.alp'));
      expect(results).toHaveLength(1);
      expect(results[0].formatted).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

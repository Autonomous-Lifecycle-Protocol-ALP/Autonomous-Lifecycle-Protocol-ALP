import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SnippetManager, Snippet } from '../src/snippet';

function makeAlpDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-snippet-'));
  fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
  return tmp;
}

describe('SnippetManager (v41.0.0)', () => {
  it('returns empty list when no snippets exist', () => {
    const tmp = makeAlpDir();
    try {
      const mgr = new SnippetManager(path.join(tmp, '.alp'));
      expect(mgr.list()).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('saves and loads a snippet', () => {
    const tmp = makeAlpDir();
    try {
      const mgr = new SnippetManager(path.join(tmp, '.alp'));
      const snippet: Snippet = {
        name: 'hello-task',
        description: 'A greeting task',
        template: { type: 'task', properties: { id: 'hello', description: 'Say hello' } },
        tags: ['greeting', 'starter'],
      };
      mgr.save(snippet);
      expect(mgr.get('hello-task')).toEqual(snippet);
      expect(mgr.list()).toHaveLength(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('filters snippets by tag', () => {
    const tmp = makeAlpDir();
    try {
      const mgr = new SnippetManager(path.join(tmp, '.alp'));
      mgr.save({ name: 's1', template: { type: 'task' }, tags: ['a'] } as Snippet);
      mgr.save({ name: 's2', template: { type: 'task' }, tags: ['b'] } as Snippet);
      mgr.save({ name: 's3', template: { type: 'task' }, tags: ['a', 'b'] } as Snippet);
      expect(mgr.getByTag('a')).toHaveLength(2);
      expect(mgr.getByTag('b')).toHaveLength(2);
      expect(mgr.getByTag('missing')).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('removes a snippet', () => {
    const tmp = makeAlpDir();
    try {
      const mgr = new SnippetManager(path.join(tmp, '.alp'));
      mgr.save({ name: 's1', template: { type: 'task' } } as Snippet);
      expect(mgr.remove('s1')).toBe(true);
      expect(mgr.get('s1')).toBeUndefined();
      expect(mgr.remove('s1')).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('validates snippets and reports errors', () => {
    const mgr = new SnippetManager(makeAlpDir());
    expect(mgr.validate({ name: '', template: {} })).toContain('Snippet name is required');
    expect(mgr.validate({ name: 'ok', template: {} })).toContain('Snippet template is required');
    expect(mgr.validate({ name: 'ok', template: { type: 'task' } })).toHaveLength(0);
  });

  it('loads snippets from existing files on construction', () => {
    const tmp = makeAlpDir();
    try {
      const snippetsDir = path.join(tmp, '.alp', 'snippets');
      fs.mkdirSync(snippetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(snippetsDir, 'preloaded.json'),
        JSON.stringify({ name: 'preloaded', template: { type: 'macro' }, tags: ['existing'] })
      );
      const mgr = new SnippetManager(path.join(tmp, '.alp'));
      expect(mgr.get('preloaded')).toBeDefined();
      expect(mgr.list()).toHaveLength(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

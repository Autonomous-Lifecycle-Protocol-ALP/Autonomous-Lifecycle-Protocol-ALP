import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as http from 'node:http';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

function httpGet(port: number, pathname: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathname }, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    req.on('error', reject);
    req.setTimeout(3500, () => req.destroy(new Error('timeout')));
  });
}

async function waitFor(port: number): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      await httpGet(port, '/api/state');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  throw new Error('server did not start');
}

describe('alp registry (Pillar 3: hosted registry & marketplace)', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch {} }
    dirs.length = 0;
  });

  function makeWorkspaceWithPackage(): { root: string; pkgDir: string } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-reg-')); dirs.push(root);
    const pkgDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-pkg-')); dirs.push(pkgDir);
    fs.writeFileSync(path.join(pkgDir, 'alp-package.json'), JSON.stringify({
      name: '@demo/scrum-master', version: '1.0.0', description: 'Scrum objects', files: ['plugin.alp'],
    }));
    fs.writeFileSync(path.join(pkgDir, 'plugin.alp'), '@agent\n  id: agent-scrum\n  name: "Scrum Master"\n');
    return { root, pkgDir };
  }

  it('publishes to local store, serves over HTTP, and installs with integrity', async () => {
    const { root, pkgDir } = makeWorkspaceWithPackage();
    fs.mkdirSync(path.join(root, '.alp'), { recursive: true });
    fs.writeFileSync(path.join(root, '.alp', 'project.alp'), '@project\n  id: demo-ws\n  name: "Demo"\n');

    execFileSync('node', [CLI, 'registry', 'publish', pkgDir], { cwd: root, encoding: 'utf-8', timeout: 20000 });

    const port = 4321;
    const proc = spawn('node', [CLI, 'serve', '--registry', '--port', String(port)], { cwd: root });
    await waitFor(port);

    try {
      const listRaw = await new Promise<string>((res) => {
        http.get({ host: '127.0.0.1', port, path: '/api/registry' }, (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        });
      });
      const list = JSON.parse(listRaw);
      expect(list.some((p: any) => p.name === '@demo/scrum-master')).toBe(true);

      const consumer = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-consumer-')); dirs.push(consumer);
      fs.mkdirSync(path.join(consumer, '.alp'), { recursive: true });
      const installed = execFileSync('node', [CLI, 'registry', 'install', '@demo/scrum-master@1.0.0', '--url', `http://127.0.0.1:${port}`], { cwd: consumer, encoding: 'utf-8', timeout: 20000 });
      expect(installed).toContain('Installed');
      expect(fs.existsSync(path.join(consumer, '.alp', 'packages', '_demo_scrum-master', 'plugin.alp'))).toBe(true);
      const lock = JSON.parse(fs.readFileSync(path.join(consumer, '.alp', 'registry.lock.json'), 'utf-8'));
      expect(lock['@demo/scrum-master'].version).toBe('1.0.0');
    } finally {
      proc.kill('SIGKILL');
    }
  }, 60000);

  it('gates /api/registry with a bearer token (spec/14 §4.2)', async () => {
    const { root, pkgDir } = makeWorkspaceWithPackage();
    fs.mkdirSync(path.join(root, '.alp'), { recursive: true });
    fs.writeFileSync(path.join(root, '.alp', 'project.alp'), '@project\n  id demo-ws\n  name: "Demo"\n');
    execFileSync('node', [CLI, 'registry', 'publish', pkgDir], { cwd: root, encoding: 'utf-8', timeout: 20000 });

    const port = 4322;
    const proc = spawn('node', [CLI, 'serve', '--registry', '--registry-token', 'secret', '--port', String(port)], { cwd: root });
    await waitFor(port);

    const getStatus = (headers: Record<string, string>) =>
      new Promise<number>((resolve) => {
        const req = http.get({ host: '127.0.0.1', port, path: '/api/registry', headers }, (r) => {
          r.resume();
          resolve(r.statusCode || 0);
        });
        req.on('error', () => resolve(0));
      });

    try {
      expect(await getStatus({})).toBe(401);
      expect(await getStatus({ Authorization: 'Bearer wrong' })).toBe(401);
      expect(await getStatus({ Authorization: 'Bearer secret' })).toBe(200);
    } finally {
      proc.kill('SIGKILL');
    }
  }, 60000);

  it('enforces per-namespace tokens and publish-time auth', async () => {
    const { root, pkgDir } = makeWorkspaceWithPackage();
    fs.mkdirSync(path.join(root, '.alp'), { recursive: true });
    fs.writeFileSync(path.join(root, '.alp', 'project.alp'), '@project\n  id demo-ws\n  name: "Demo"\n');
    execFileSync('node', [CLI, 'registry', 'publish', pkgDir], { cwd: root, encoding: 'utf-8', timeout: 20000 });

    const port = 4323;
    const proc = spawn('node', [CLI, 'serve', '--registry', '--registry-token', '@demo=demo-secret', '--port', String(port)], { cwd: root });
    await waitFor(port);

    const getStatus = (pathname: string, headers: Record<string, string> = {}) =>
      new Promise<number>((resolve) => {
        const req = http.get({ host: '127.0.0.1', port, path: pathname, headers }, (r) => { r.resume(); resolve(r.statusCode || 0); });
        req.on('error', () => resolve(0));
      });

    const putStatus = (headers: Record<string, string> = {}) =>
      new Promise<number>((resolve) => {
        const body = JSON.stringify({
          name: '@demo/scrum-master', version: '1.0.0', description: 'Scrum', files: [{ path: 'plugin.alp', content: '@agent\n  id: a\n' }],
        });
        const req = http.request({ host: '127.0.0.1', port, path: '/api/registry/-/demo/scrum-master', method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers } }, (r) => { r.resume(); resolve(r.statusCode || 0); });
        req.on('error', () => resolve(0));
        req.write(body);
        req.end();
      });

    try {
      expect(await getStatus('/api/registry/-/demo/scrum-master/meta.json')).toBe(401);
      expect(await getStatus('/api/registry/-/demo/scrum-master/meta.json', { Authorization: 'Bearer demo-secret' })).toBe(200);
      expect(await putStatus({ Authorization: 'Bearer wrong' })).toBe(401);
      expect(await putStatus({ Authorization: 'Bearer demo-secret' })).toBe(201);
      expect(await getStatus('/api/registry/-/public/pkg/meta.json')).toBe(404);
    } finally {
      proc.kill('SIGKILL');
    }
  });

  it('publish over HTTP via alp publish --url with namespace token', async () => {
    const { root, pkgDir } = makeWorkspaceWithPackage();
    fs.mkdirSync(path.join(root, '.alp'), { recursive: true });
    fs.writeFileSync(path.join(root, '.alp', 'project.alp'), '@project\n  id demo-ws\n  name: "Demo"\n');

    const port = 4324;
    const proc = spawn('node', [CLI, 'serve', '--registry', '--registry-token', '@demo=demo-secret', '--port', String(port)], { cwd: root });
    await waitFor(port);

    const publish = (token?: string) => {
      const args = [CLI, 'registry', 'publish', pkgDir, '--url', `http://127.0.0.1:${port}`];
      if (token) args.push('--token', token);
      try {
        return { code: 0, out: execFileSync('node', args, { cwd: root, encoding: 'utf-8', timeout: 20000 }) };
      } catch {
        return { code: 1, out: '' };
      }
    };

    try {
      expect(publish().out.toLowerCase()).not.toContain('published');
      expect(publish('demo-secret').out).toContain('Published');
    } finally {
      proc.kill('SIGKILL');
    }
  }, 60000);
});

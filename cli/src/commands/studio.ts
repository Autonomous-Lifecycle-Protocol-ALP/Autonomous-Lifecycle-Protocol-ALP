import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export interface ShamCommandOptions {
  dev?: boolean;
}

export interface StudioCommandOptions {
  open?: boolean;
  port?: string;
  start?: boolean;
}

export function shamCommand(opts: ShamCommandOptions = {}) {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🖥️  SHAM DESKTOP IDE (Smart Hosted Agent Manager)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Find root directory containing sham workspace
  let currentDir = process.cwd();
  let shamDir = '';
  while (currentDir && currentDir !== path.dirname(currentDir)) {
    const candidate = path.join(currentDir, 'sham');
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'package.json'))) {
      shamDir = candidate;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  if (!shamDir) {
    if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
        if (pkg.name === 'sham') {
          shamDir = process.cwd();
        }
      } catch {}
    }
  }

  if (!shamDir) {
    console.error('❌ Error: Could not locate SHAM workspace. Run this command inside the ALP repository.');
    process.exit(1);
  }

  const unpackedExe = path.join(shamDir, 'dist-installer', 'win-unpacked', 'SHAM.exe');
  if (!opts.dev && process.platform === 'win32' && fs.existsSync(unpackedExe)) {
    console.log(`🚀 Launching standalone desktop binary: ${unpackedExe}`);
    const child = spawn(unpackedExe, [], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    console.log('✨ SHAM Desktop IDE launched successfully.');
    return;
  }

  console.log(`🛠️  Launching SHAM in developer mode from: ${shamDir}`);
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const electronCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(electronCmd, ['electron', '.'], {
    cwd: shamDir,
    detached: true,
    stdio: 'ignore',
    env,
    shell: true,
  });
  child.unref();
  console.log('✨ SHAM Desktop IDE process started in background.');
}

export function studioCommand(target: string = 'portal', opts: StudioCommandOptions = {}) {
  const t = (target || 'portal').toLowerCase();
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🌐 ALP STUDIO & WEB SERVICES');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const services: Record<string, { name: string; url: string; dir: string; script: string; desc: string }> = {
    portal: {
      name: 'Enterprise Web Portal',
      url: opts.port ? `http://localhost:${opts.port}` : 'http://localhost:5174',
      dir: 'commercial/enterprise-app',
      script: 'npm run dev',
      desc: 'Role-based enterprise management, ZK proof studio, & analytics',
    },
    playground: {
      name: 'Monaco Web Playground',
      url: opts.port ? `http://localhost:${opts.port}` : 'http://localhost:5173',
      dir: 'playground',
      script: 'npm run dev',
      desc: 'Interactive browser Monaco editor for testing ALP models',
    },
    server: {
      name: 'Enterprise Backend API',
      url: opts.port ? `http://localhost:${opts.port}` : 'http://localhost:5000',
      dir: 'commercial/alp-server',
      script: 'npm run dev:mongo',
      desc: 'Express API server with in-memory MongoDB and WebSockets',
    },
    docs: {
      name: 'Documentation Site',
      url: opts.port ? `http://localhost:${opts.port}` : 'http://localhost:5173',
      dir: 'docs-site',
      script: 'npm run dev',
      desc: 'VitePress documentation portal',
    },
  };

  const selected = services[t] || services.portal;
  console.log(`🎯 Service:    ${selected.name}`);
  console.log(`🔗 URL:        ${selected.url}`);
  console.log(`📖 Details:    ${selected.desc}`);
  console.log(`📂 Location:   ${selected.dir}`);
  console.log(`🔑 Demo Login: demo@alp-enterprise.com / demo123\n`);

  if (opts.start) {
    let repoRoot = process.cwd();
    while (repoRoot && repoRoot !== path.dirname(repoRoot)) {
      if (fs.existsSync(path.join(repoRoot, selected.dir))) break;
      repoRoot = path.dirname(repoRoot);
    }
    const targetPath = path.join(repoRoot, selected.dir);
    if (fs.existsSync(targetPath)) {
      console.log(`🚀 Starting ${selected.name} (${selected.script})...`);
      const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
        cwd: targetPath,
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      child.unref();
      console.log(`✅ Started in background.`);
    }
  }

  if (opts.open) {
    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(startCmd, [selected.url], { shell: true, detached: true, stdio: 'ignore' }).unref();
    console.log(`🌐 Opened ${selected.url} in your default browser.`);
  } else {
    console.log(`💡 Tip: Use 'alp studio ${t} --open' to automatically open in your default browser.`);
    console.log(`       Use 'alp studio ${t} --start' to launch the background service.`);
  }
}

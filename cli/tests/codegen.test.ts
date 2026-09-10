import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

const FIXTURE = '@task\n  id: deploy\n  status: [ ]\n  depends_on:\n    - -> build\n@task\n  id: build\n  status: [x]\n@agent\n  id: builder\n  role: "Build Agent"\n';

describe('alp codegen (PHP / C++)', () => {
  it('generates PHP classes from the workspace', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-codegen-php-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'spec.alp'), FIXTURE, 'utf-8');

      const output = execFileSync('node', [CLI, 'codegen', '--target', 'php'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Generated 3 PHP file(s)');
      const deploy = fs.readFileSync(path.join(tmp, 'alp-codegen', 'php', 'DeployTask.php'), 'utf-8');
      expect(deploy).toContain('<?php');
      expect(deploy).toContain('namespace Alp\\Generated;');
      expect(deploy).toContain('use Alp\\Generated\\BuildTask;');
      expect(deploy).toContain('private ?BuildTask $buildType = null;');
      const agent = fs.readFileSync(path.join(tmp, 'alp-codegen', 'php', 'Agent.php'), 'utf-8');
      expect(agent).not.toContain('use Alp\\Generated\\');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('generates C++ headers and impls from the workspace', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-codegen-cpp-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'spec.alp'), FIXTURE, 'utf-8');

      const output = execFileSync('node', [CLI, 'codegen', '--target', 'cpp', '--namespace', 'app'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Generated 6 CPP file(s)');
      const deployHeader = fs.readFileSync(path.join(tmp, 'alp-codegen', 'cpp', 'DeployTask.hpp'), 'utf-8');
      expect(deployHeader).toContain('namespace app');
      expect(deployHeader).toContain('#include "BuildTask.hpp"');
      expect(deployHeader).toContain('class DeployTask');
      const deployImpl = fs.readFileSync(path.join(tmp, 'alp-codegen', 'cpp', 'DeployTask.cpp'), 'utf-8');
      expect(deployImpl).toContain('#include "DeployTask.hpp"');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('fails cleanly when --target is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-codegen-bad-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'spec.alp'), FIXTURE, 'utf-8');

      expect(() =>
        execFileSync('node', [CLI, 'codegen'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
          stdio: 'pipe',
        })
      ).toThrow(/requiredOption|--target/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('fails cleanly when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-codegen-noalp-'));
    try {
      expect(() =>
        execFileSync('node', [CLI, 'codegen', '--target', 'php'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
          stdio: 'pipe',
        })
      ).toThrow();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

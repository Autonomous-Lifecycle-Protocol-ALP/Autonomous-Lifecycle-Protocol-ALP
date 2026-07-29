import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TestRunner, TestCase, TestSuiteResult, CoverageReport } from '../src/test-runner';

function makeAlpDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-test-runner-'));
  fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
  return tmp;
}

describe('TestRunner (v42.0.0)', () => {
  it('runs a workspace with @test objects', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: t1
  description: "A test task"
  status: [ ]
@test
  id: test-t1
  description: "t1 should exist"
`);
      const runner = new TestRunner();
      const results = runner.runWorkspace(path.join(tmp, '.alp'));
      expect(results).toHaveLength(1);
      expect(results[0].total).toBe(1);
      expect(results[0].passed).toBe(1);
      expect(results[0].tests[0].passed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports failures for expect_fail tests', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@test
  id: test-bad
  description: "should fail"
  expect_fail: true
`);
      const runner = new TestRunner();
      const results = runner.runWorkspace(path.join(tmp, '.alp'));
      expect(results[0].failed).toBe(1);
      expect(results[0].tests[0].passed).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns coverage report', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@task
  id: t1
@test
  id: test-t1
`);
      const runner = new TestRunner();
      runner.runWorkspace(path.join(tmp, '.alp'));
      const coverage = runner.getCoverage(path.join(tmp, '.alp'));
      expect(coverage.files).toBe(1);
      expect(coverage.totalObjects).toBeGreaterThanOrEqual(2);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('runs a single file', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@test
  id: test-t1
  description: "single file test"
`);
      const runner = new TestRunner();
      const result = runner.runFile(path.join(tmp, '.alp', 't1.alp'));
      expect(result.file).toContain('t1.alp');
      expect(result.total).toBe(1);
      expect(result.passed).toBe(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns summary with pass rate', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(path.join(tmp, '.alp', 't1.alp'), `
@test
  id: test-1
@test
  id: test-2
`);
      const runner = new TestRunner();
      runner.runWorkspace(path.join(tmp, '.alp'));
      const summary = runner.getSummary();
      expect(summary.totalTests).toBe(2);
      expect(summary.passRate).toBe(100);
      expect(summary.suites).toBe(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

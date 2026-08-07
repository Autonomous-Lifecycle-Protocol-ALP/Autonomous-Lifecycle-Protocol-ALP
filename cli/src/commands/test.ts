import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, TestSuiteResult } from '@autonomous-lifecycle-protocol-alp/parser';

export interface TestOptions {
  coverage?: boolean;
  file?: string;
}

export function testCommand(options?: TestOptions) {
  const cwd = process.cwd();
  const alpDir = path.resolve(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const runner = new TestRunner();
  const results: TestSuiteResult[] = options?.file
    ? [runner.runFile(path.resolve(cwd, options.file))]
    : runner.runWorkspace(alpDir);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  console.log('🧪 Running ALP Tests...\n');

  for (const suite of results) {
    const relative = path.relative(cwd, suite.file);
    console.log(`\n📄 ${relative}`);
    for (const test of suite.tests) {
      const icon = test.passed ? '✅' : '❌';
      console.log(`  ${icon} ${test.id}: ${test.description}${test.error ? ` (${test.error})` : ''}`);
      if (test.passed) totalPassed++;
      else totalFailed++;
    }
    console.log(`  ${suite.passed}/${suite.total} passed (${suite.durationMs}ms)`);
    totalDuration += suite.durationMs;
  }

  const summary = runner.getSummary();
  console.log(`\n📊 Test Summary: ${summary.totalPassed} passed, ${summary.totalFailed} failed, ${summary.totalTests} total`);
  console.log(`   Pass rate: ${summary.passRate}% | Duration: ${totalDuration}ms`);

  if (options?.coverage) {
    const coverage = runner.getCoverage(alpDir);
    console.log(`\n📈 Coverage: ${coverage.coveredObjects}/${coverage.totalObjects} objects (${coverage.coveragePercent}%) across ${coverage.files} files`);
  }

  if (totalFailed > 0) {
    process.exit(1);
  }
}

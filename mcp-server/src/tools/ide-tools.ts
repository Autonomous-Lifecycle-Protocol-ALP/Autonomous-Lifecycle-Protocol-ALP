import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace, findAlpFiles } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_test',
    description: 'Run ALP tests with pass/fail reporting and optional coverage (v42.0.0 IDE Quality).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        file: { type: 'string', description: 'Optional specific test file to run' },
        coverage: { type: 'boolean', description: 'Include coverage report' }
      },
      required: []
    }
  },
  {
    name: 'alp_lint',
    description: 'Lint the ALP workspace and return diagnostics (v42.0.0 IDE Quality).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        file: { type: 'string', description: 'Optional specific file to lint' }
      },
      required: []
    }
  },
  {
    name: 'alp_format',
    description: 'Format .alp files and return changed files (v42.0.0 IDE Quality).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        file: { type: 'string', description: 'Optional specific file to format' },
        check: { type: 'boolean', description: 'Check formatting without writing changes' }
      },
      required: []
    }
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_test': {
      const { TestRunner } = require('@autonomous-lifecycle-protocol-alp/parser');
      const runner = new TestRunner();
      const fileArg = args?.file as string | undefined;
      const results = fileArg
        ? [runner.runFile(path.resolve(cwd, fileArg))]
        : runner.runWorkspace(path.resolve(cwd, '.alp'));
      const summary = runner.getSummary();
      const lines: string[] = [];
      for (const suite of results) {
        lines.push(`\n📄 ${path.relative(cwd, suite.file)}`);
        for (const t of suite.tests) {
          lines.push(`  ${t.passed ? '✅' : '❌'} ${t.id}: ${t.description}${t.error ? ` (${t.error})` : ''}`);
        }
        lines.push(`  ${suite.passed}/${suite.total} passed (${suite.durationMs}ms)`);
      }
      lines.push(`\n📊 ${summary.totalPassed} passed, ${summary.totalFailed} failed, ${summary.totalTests} total (${summary.passRate}%)`);
      if (args?.coverage) {
        const cov = runner.getCoverage(path.resolve(cwd, '.alp'));
        lines.push(`📈 Coverage: ${cov.coveredObjects}/${cov.totalObjects} objects (${cov.coveragePercent}%)`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    case 'alp_lint': {
      const { Linter } = require('@autonomous-lifecycle-protocol-alp/parser');
      const linter = new Linter();
      const fileArg = args?.file as string | undefined;
      const results = fileArg
        ? [{ file: path.resolve(cwd, fileArg), diagnostics: linter.lintFile(path.resolve(cwd, fileArg)) }]
        : linter.lintDirectory(path.resolve(cwd, '.alp'));
      const lines: string[] = ['🔍 Lint Results:'];
      let errors = 0;
      let warnings = 0;
      for (const { file, diagnostics } of results) {
        for (const d of diagnostics) {
          const icon = d.severity === 'error' ? '❌' : '⚠️';
          lines.push(`${icon} ${path.relative(cwd, file)}: ${d.message}`);
          if (d.severity === 'error') errors++;
          else warnings++;
        }
      }
      if (results.length === 0) {
        lines.push('✅ No lint issues found.');
      } else {
        lines.push(`\nFound ${errors} errors and ${warnings} warnings.`);
      }
      return {
        content: [{ type: 'text', text: lines.join('\n') }],
        isError: errors > 0,
      };
    }

    case 'alp_format': {
      const { AlpFormatter } = require('@autonomous-lifecycle-protocol-alp/parser');
      const formatter = new AlpFormatter({ indentSize: 2 });
      const fileArg = args?.file as string | undefined;
      const files = fileArg
        ? [path.resolve(cwd, fileArg)]
        : findAlpFiles(path.resolve(cwd, '.alp'));
      const lines: string[] = ['📝 Format Results:'];
      let changed = 0;
      for (const file of files) {
        const original = fs.readFileSync(file, 'utf8');
        const formatted = formatter.format(original);
        const rel = path.relative(cwd, file);
        if (args?.check) {
          if (original !== formatted) {
            lines.push(`❌ ${rel} needs formatting`);
            changed++;
          }
        } else if (original !== formatted) {
          fs.writeFileSync(file, formatted, 'utf8');
          lines.push(`✅ Formatted ${rel}`);
          changed++;
        }
      }
      if (args?.check) {
        lines.push(`\n${files.length} checked, ${changed} would be reformatted.`);
      } else {
        lines.push(`\nFormatted ${changed} file(s).`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    default:
      return null;
  }
}

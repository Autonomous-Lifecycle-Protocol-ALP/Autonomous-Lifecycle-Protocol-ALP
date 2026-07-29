import * as fs from 'fs';
import * as path from 'path';
import { Linter, LintDiagnostic } from '@autonomous-lifecycle-protocol-alp/parser';

export function lintCommand() {
  const alpDir = path.resolve(process.cwd(), '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const linter = new Linter();
  const results = linter.lintDirectory(alpDir);

  let warnings = 0;
  let errors = 0;
  const allDiagnostics: LintDiagnostic[] = [];

  console.log('🔍 Linting ALP Workspace...\n');

  for (const { file, diagnostics } of results) {
    const relative = path.relative(process.cwd(), file);
    for (const d of diagnostics) {
      const icon = d.severity === 'error' ? '❌' : '⚠️';
      const label = d.severity === 'error' ? 'ERROR' : 'WARN';
      console.log(`${icon} [${label}] ${relative}: ${d.message}`);
      if (d.severity === 'error') errors++;
      else warnings++;
      allDiagnostics.push(d);
    }
  }

  if (results.length === 0) {
    console.log('✅ No lint issues found.\n');
  } else {
    console.log(`\nLinting complete. Found ${errors} errors and ${warnings} warnings.`);
  }

  if (errors > 0) {
    process.exit(1);
  }
}

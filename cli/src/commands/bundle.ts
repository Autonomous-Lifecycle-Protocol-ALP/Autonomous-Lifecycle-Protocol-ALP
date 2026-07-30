import { Command } from 'commander';
import { ContextBundler } from '@autonomous-lifecycle-protocol-alp/parser';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';
import fs from 'fs';
import path from 'path';

export function registerBundleCommand(program: Command) {
  program
    .command('bundle')
    .description('Compile an optimized edge context bundle from your .alp/ workspace (v46.0.0)')
    .option('--format <format>', 'Output format: json, wasm-compat', 'json')
    .option('--id <id>', 'Bundle ID', `bundle-${Date.now()}`)
    .option('--out <file>', 'Write bundle to file instead of stdout')
    .option('--cwd <dir>', 'Working directory', '.')
    .action((options) => {
      const cwd = path.resolve(options.cwd);
      const alpDir = path.join(cwd, '.alp');

      if (!fs.existsSync(alpDir)) {
        console.error(`\n❌ No .alp/ directory found in ${cwd}`);
        process.exitCode = 1;
        return;
      }

      // Parse all .alp files
      const parser = new AlpParser();
      const objects: any[] = [];
      const files = fs.readdirSync(alpDir).filter(f => f.endsWith('.alp'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(alpDir, file), 'utf-8');
        objects.push(...parser.parse(content));
      }

      if (objects.length === 0) {
        console.error('\n⚠️  No ALP objects found in workspace.');
        process.exitCode = 1;
        return;
      }

      // Compile the context bundle
      const bundler = new ContextBundler();
      const result = bundler.compile(
        objects.map(o => ({ id: o.id, type: o._type, properties: o.properties || {} })),
        { format: options.format, bundleId: options.id }
      );

      if (options.out) {
        const outPath = path.resolve(options.out);
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
        console.log(`\n✅ Bundle written to ${outPath}`);
      }

      console.log('\n⚡ Edge Context Bundle Compiled (v46.0.0)');
      console.log('==========================================');
      console.log(`  Bundle ID:     ${result.manifest.id}`);
      console.log(`  Format:        ${result.manifest.format}`);
      console.log(`  Objects:       ${result.manifest.objectCount}`);
      console.log(`  Token Est.:    ${result.manifest.tokenEstimate}`);
      console.log(`  Compression:   ${result.manifest.compressionRatio}%`);
      console.log(`  Size:          ${result.sizeBytes} bytes`);
      console.log(`  Compiled In:   ${result.manifest.compilationMs} ms`);
      console.log(`  Checksum:      ${result.manifest.checksum}`);
      console.log(`  Integrity:     ${bundler.verify(result) ? '✅ VERIFIED' : '❌ FAILED'}\n`);
    });
}

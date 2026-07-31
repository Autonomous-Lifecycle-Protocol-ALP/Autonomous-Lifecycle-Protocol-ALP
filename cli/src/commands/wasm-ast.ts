import { Command } from 'commander';
import { WasmAstEvaluator } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerWasmAstCommand(program: Command) {
  program
    .command('wasm-ast')
    .description('High-performance sub-5ms local Wasm AST parsing & offline linting (v66.0.0)')
    .option('--content <spec>', 'ALP spec string to parse', '@policy name: "auth-guard" { allow: ["/api/*"] }\n@task id: "deploy-task"')
    .action((options) => {
      const evaluator = new WasmAstEvaluator();
      const result = evaluator.parseAST(options.content);

      console.log('\n⚡ Wasm-Compiled Local AST Evaluator (v66.0.0)');
      console.log('==============================================');
      console.log(`  Parse Latency:   ${result.parseLatencyMs}ms ${result.parseLatencyMs <= 5 ? '⚡ (Sub-5ms Target Hit)' : ''}`);
      console.log(`  Offline Valid:   ${result.offlineValid ? '✅ VALID' : '❌ INVALID'}`);
      console.log(`  AST Nodes:       ${result.ast.length}`);
      result.ast.forEach(node => {
        console.log(`    - [${node.kind}] ${node.name} (line ${node.line})`);
      });
      console.log(`  Diagnostics:     ${result.diagnostics.length}`);
      result.diagnostics.forEach(diag => {
        console.log(`    - [${diag.severity}] Line ${diag.line}: ${diag.message} (${diag.ruleId})`);
      });
      console.log();
    });
}

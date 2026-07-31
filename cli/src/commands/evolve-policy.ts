import { Command } from 'commander';
import { PolicyOptimizer } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerEvolvePolicyCommand(program: Command) {
  program
    .command('evolve-policy')
    .description('Run genetic algorithm policy evolution on workspace governance rules (v52.0.0)')
    .option('--generations <count>', 'Number of evolution generations', '5')
    .option('--allow <paths>', 'Initial comma-separated allowed paths', 'src/*,docs/*')
    .option('--deny <paths>', 'Initial comma-separated denied paths', '.env,secrets/*')
    .action((options) => {
      const generations = parseInt(options.generations, 10);
      const allowPaths = options.allow.split(',').map((p: string) => p.trim());
      const denyPaths = options.deny.split(',').map((p: string) => p.trim());

      const optimizer = new PolicyOptimizer();
      const result = optimizer.evolve(allowPaths, denyPaths, undefined, generations);

      console.log('\n🧬 Genetic Algorithm Policy Evolution (v52.0.0)');
      console.log('================================================');
      console.log(`  Generations Evaluated: ${result.generationsEvaluated}`);
      console.log(`  Best Candidate ID:     ${result.bestPolicy.id}`);
      console.log(`  Fitness Score:         ${(result.bestPolicy.fitnessScore * 100).toFixed(1)}%`);
      console.log(`  Fitness Improvement:   +${result.fitnessImprovementPct}%`);
      console.log(`  Evolved Allow Paths:   ${result.bestPolicy.allowPaths.join(', ')}`);
      console.log(`  Evolved Deny Paths:    ${result.bestPolicy.denyPaths.join(', ')}\n`);
    });
}

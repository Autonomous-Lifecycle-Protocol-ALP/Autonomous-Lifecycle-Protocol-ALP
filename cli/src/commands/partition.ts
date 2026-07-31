import { Command } from 'commander';
import { AlpParser, AlpGraph, DAGPartitioner } from '@autonomous-lifecycle-protocol-alp/parser';
import fs from 'fs';
import path from 'path';

export function registerPartitionCommand(program: Command) {
  program
    .command('partition')
    .description('Partition DAG execution graph across multi-region edge runners (v50.0.0)')
    .option('--regions <regions>', 'Comma-separated target cloud regions', 'us-east,eu-west,ap-southeast')
    .option('--out <file>', 'Write region partitions JSON to file')
    .option('--cwd <dir>', 'Working directory', '.')
    .action((options) => {
      const cwd = path.resolve(options.cwd);
      const alpDir = path.join(cwd, '.alp');

      if (!fs.existsSync(alpDir)) {
        console.error(`\n❌ No .alp/ directory found in ${cwd}`);
        process.exitCode = 1;
        return;
      }

      const parser = new AlpParser();
      const objects: any[] = [];
      const files = fs.readdirSync(alpDir).filter(f => f.endsWith('.alp'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(alpDir, file), 'utf-8');
        objects.push(...parser.parse(content));
      }

      const graph = new AlpGraph();
      graph.buildGraph(objects);

      const targetRegions = options.regions.split(',').map((r: string) => r.trim());
      const partitioner = new DAGPartitioner();
      const result = partitioner.partition(graph, targetRegions);

      if (options.out) {
        const outPath = path.resolve(options.out);
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
        console.log(`\n✅ Partition plan written to ${outPath}`);
      }

      console.log('\n🌐 Multi-Region DAG Partition Plan (v50.0.0)');
      console.log('=============================================');
      console.log(`  Total Nodes:       ${result.totalNodes}`);
      console.log(`  Cross-Region Edges: ${result.crossRegionEdgesCount}`);
      console.log(`  Target Regions:    ${targetRegions.join(', ')}\n`);

      for (const region of result.regions) {
        console.log(`  📍 Region [${region.region}]:`);
        console.log(`     Nodes:    ${region.nodeIds.length > 0 ? region.nodeIds.join(', ') : 'None'}`);
        console.log(`     Est. Latency: ${region.estimatedLatencyMs} ms\n`);
      }
    });
}

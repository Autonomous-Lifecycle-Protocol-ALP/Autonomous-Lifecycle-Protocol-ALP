import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';

interface SynapseExportOptions {
  out?: string;
  canvas?: boolean;
}

interface SynapseGraphOptions {
  format?: 'json' | 'dot' | 'mermaid' | 'canvas';
  out?: string;
}

function loadAllObjects(): AlpObject[] {
  const alpDir = path.resolve(process.cwd(), '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const objects: AlpObject[] = [];

  const readDir = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readDir(fullPath);
      } else if (entry.name.endsWith('.alp')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          objects.push(...parser.parse(content));
        } catch (e: any) {
          console.error(`Error parsing ${fullPath}: ${e.message}`);
          process.exit(1);
        }
      }
    }
  };

  readDir(alpDir);
  return objects;
}

export function synapseExportCommand(options: SynapseExportOptions) {
  const objects = loadAllObjects();
  const engine = new SynapseEngine();
  const outDir = path.resolve(process.cwd(), options.out || '.synapse');

  console.log(`[SYNAPSE] Generating Knowledge Graph Vault from ${objects.length} ALP objects...`);
  const files = engine.generateVault(objects);

  let createdCount = 0;
  for (const file of files) {
    const destPath = path.join(outDir, file.relativePath);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.writeFileSync(destPath, file.content, 'utf-8');
    createdCount++;
  }

  console.log(`[SYNAPSE] ✅ Successfully exported ${createdCount} notes & canvas to: ${outDir}`);
  console.log(`[SYNAPSE] 📖 Open '${path.join(outDir, 'MOC.md')}' for the Map of Content.`);
  console.log(`[SYNAPSE] 🎨 Open '${path.join(outDir, 'synapse.canvas')}' in any visual canvas tool.`);
}

export function synapseGraphCommand(options: SynapseGraphOptions) {
  const objects = loadAllObjects();
  const engine = new SynapseEngine();
  const topology = engine.buildTopology(objects);
  const format = options.format || 'json';

  let output = '';
  switch (format) {
    case 'mermaid':
      output = engine.toMermaid(topology);
      break;
    case 'dot':
      output = engine.toDot(topology);
      break;
    case 'canvas':
      output = JSON.stringify(engine.generateCanvas(topology), null, 2);
      break;
    case 'json':
    default:
      output = JSON.stringify(topology, null, 2);
      break;
  }

  if (options.out) {
    const destPath = path.resolve(process.cwd(), options.out);
    fs.writeFileSync(destPath, output, 'utf-8');
    console.log(`[SYNAPSE] Graph written to ${destPath} (${format})`);
  } else {
    console.log(output);
  }
}

export function synapseStatsCommand() {
  const objects = loadAllObjects();
  const engine = new SynapseEngine();
  const topology = engine.buildTopology(objects);
  const stats = topology.stats;

  console.log('\n🧠 Synapse Knowledge Graph Statistics');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total Nodes:    ${stats.totalNodes}`);
  console.log(`  Total Edges:    ${stats.totalEdges}`);
  console.log(`  Graph Density:  ${(stats.density * 100).toFixed(2)}%`);
  console.log('───────────────────────────────────────────────────');
  console.log('  Entities by Type:');
  for (const [type, count] of Object.entries(stats.byTypeCount)) {
    console.log(`    @${type.padEnd(14)} : ${count}`);
  }
  if (Object.keys(stats.byStatusCount).length > 0) {
    console.log('  Tasks by Status:');
    for (const [status, count] of Object.entries(stats.byStatusCount)) {
      console.log(`    ${status.padEnd(15)} : ${count}`);
    }
  }
  console.log('───────────────────────────────────────────────────');
  console.log('  Top Central Hubs:');
  for (const hub of stats.centralHubs.slice(0, 5)) {
    console.log(`    ⭐ ${hub.id.padEnd(20)} (${hub.degree} connections)`);
  }
  if (stats.orphanNodes.length > 0) {
    console.log(`  ⚠️ Orphan Nodes: ${stats.orphanNodes.join(', ')}`);
  }
  if (stats.brokenLinks.length > 0) {
    console.log(`  🚨 Broken Links (${stats.brokenLinks.length}):`);
    for (const bl of stats.brokenLinks) {
      console.log(`     - ${bl.source} ➔ ${bl.target} (not found)`);
    }
  }
  console.log('═══════════════════════════════════════════════════\n');
}

import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';

/**
 * Synapse Mesh Example Orchestrator
 *
 * Demonstrates:
 * 1. Loading and parsing ALP workspace specification files (.alp)
 * 2. Compiling the Synapse knowledge graph topology
 * 3. Performing degree centrality & bottleneck analytics
 * 4. Exporting Obsidian-compatible Markdown vault with wikilinks & .canvas
 */
export async function runSynapseMeshDemo() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧠 ALP SYNAPSE MESH ORCHESTRATOR DEMO (v80.0.0)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const parser = new AlpParser();
  const alpDir = path.resolve(__dirname, '../.alp');
  const allObjects: AlpObject[] = [];

  const alpFiles = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  console.log(`[1] Parsing ${alpFiles.length} ALP specification files...`);

  for (const file of alpFiles) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = parser.parse(content);
    console.log(`    • ${file} -> ${parsed.length} objects`);
    allObjects.push(...parsed);
  }

  console.log(`\n[2] Compiling Synapse Knowledge Graph from ${allObjects.length} total objects...`);
  const engine = new SynapseEngine();
  const topology = engine.buildTopology(allObjects);

  console.log('    📊 Topology Metrics:');
  console.log(`       - Total Nodes:    ${topology.stats.totalNodes}`);
  console.log(`       - Total Edges:    ${topology.stats.totalEdges}`);
  console.log(`       - Graph Density:  ${topology.stats.density.toFixed(4)}`);
  console.log(`       - Central Hubs:   ${topology.stats.centralHubs.map((h) => `${h.id} (${h.degree})`).join(', ')}`);
  console.log(`       - Broken Links:   ${topology.stats.brokenLinks.length}`);
  console.log(`       - Orphan Nodes:   ${topology.stats.orphanNodes.length}`);

  console.log('\n[3] Generating Synapse Markdown Vault with [[wikilinks]] & Canvas...');
  const vaultFiles = engine.generateVault(allObjects);
  console.log(`    ✅ Successfully compiled ${vaultFiles.length} vault documents:`);
  for (const vf of vaultFiles) {
    console.log(`       📄 ${vf.relativePath}`);
  }

  console.log('\n[4] Generating Interactive JSON Canvas (.canvas)...');
  const canvas = engine.generateCanvas(topology);
  console.log(`    🎨 Canvas Nodes: ${canvas.nodes.length}, Edges: ${canvas.edges.length}`);

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✨ Synapse Mesh analysis and vault generation completed successfully!');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  return { topology, vaultFiles, canvas };
}

if (require.main === module) {
  runSynapseMeshDemo().catch(console.error);
}

import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject, MultiModalEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge, SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';

/**
 * Multi-Modal VLA Example Orchestrator
 *
 * Demonstrates:
 * 1. Loading and parsing ALP workspace specification files (.alp)
 * 2. Validating multimodal, vision model, and action space specifications
 * 3. Compiling the Synapse knowledge graph topology
 * 4. Estimating token costs and verifying safety guards
 * 5. Generating Obsidian-compatible Markdown vault with wikilinks & .canvas
 */
export async function runMultimodalVLADemo() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🤖 ALP MULTI-MODAL VLA ORCHESTRATOR DEMO (v82.0.0)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const parser = new AlpParser();
  const multimodalEngine = new MultiModalEngine();
  const synapseEngine = new SynapseEngine();
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

  console.log(`\n[2] Validating Multi-Modal & VLA Specifications...`);
  const multimodalSpecs = allObjects.filter((o) => o._type === 'multimodal');
  const visionModels = allObjects.filter((o) => o._type === 'vision_model');
  const actionSpaces = allObjects.filter((o) => o._type === 'action_space');

  console.log(`    • Multimodal specs: ${multimodalSpecs.length}`);
  console.log(`    • Vision models:    ${visionModels.length}`);
  console.log(`    • Action spaces:    ${actionSpaces.length}`);

  for (const spec of multimodalSpecs) {
    const result = multimodalEngine.validateMultimodal(spec as any);
    console.log(`    ✓ ${spec.id}: valid=${result.valid}, tokens=${result.totalTokensEstimate}, safetyScore=${result.safetyScore}`);
    if (result.warnings.length > 0) {
      console.log(`      warnings: ${result.warnings.join(', ')}`);
    }
  }

  for (const model of visionModels) {
    const result = multimodalEngine.validateVisionModel(model as any);
    console.log(`    ✓ ${model.id}: valid=${result.valid}`);
    if (result.errors.length > 0) {
      console.log(`      errors: ${result.errors.join(', ')}`);
    }
  }

  for (const space of actionSpaces) {
    const result = multimodalEngine.validateActionSpace(space as any);
    console.log(`    ✓ ${space.id}: valid=${result.valid}, criticalActions=${result.criticalActionCount}`);
    if (result.warnings.length > 0) {
      console.log(`      warnings: ${result.warnings.join(', ')}`);
    }
  }

  const tokenEstimates: Record<string, number> = {};
  for (const spec of multimodalSpecs) {
    const assets = (spec as any).assets || [];
    const modalities = (spec as any).modalities || [];
    const visionModel = visionModels[0];
    tokenEstimates[spec.id] = multimodalEngine.estimateTokenCost(modalities, assets, visionModel as any);
    console.log(`    💰 ${spec.id}: estimated tokens = ${tokenEstimates[spec.id]}`);
  }

  console.log('\n[3] Compiling Synapse Knowledge Graph from all objects...');
  const topology = synapseEngine.buildTopology(allObjects);

  console.log('    📊 Topology Metrics:');
  console.log(`       - Total Nodes:    ${topology.stats.totalNodes}`);
  console.log(`       - Total Edges:    ${topology.stats.totalEdges}`);
  console.log(`       - Graph Density:  ${topology.stats.density.toFixed(4)}`);
  console.log(`       - Central Hubs:   ${topology.stats.centralHubs.map((h) => `${h.id} (${h.degree})`).join(', ')}`);
  console.log(`       - Broken Links:   ${topology.stats.brokenLinks.length}`);
  console.log(`       - Orphan Nodes:   ${topology.stats.orphanNodes.length}`);

  console.log('\n[4] Generating Synapse Markdown Vault with [[wikilinks]] & Canvas...');
  const vaultFiles = synapseEngine.generateVault(allObjects);
  console.log(`    ✅ Successfully compiled ${vaultFiles.length} vault documents:`);
  for (const vf of vaultFiles) {
    console.log(`       📄 ${vf.relativePath}`);
  }

  console.log('\n[5] Generating Interactive JSON Canvas (.canvas)...');
  const canvas = synapseEngine.generateCanvas(topology);
  console.log(`    🎨 Canvas Nodes: ${canvas.nodes.length}, Edges: ${canvas.edges.length}`);

  console.log('\n[6] Verifying Safety Guards for Action Spaces...');
  for (const space of actionSpaces) {
    const guardResult = multimodalEngine.verifySafetyGuards(space as any, [
      'enforce-human-in-the-loop',
      'strict-boundary',
    ]);
    console.log(`    🛡️  ${space.id}: allowed=${guardResult.allowed}, blocked=${guardResult.blockedActions.join(', ') || 'none'}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✨ Multi-Modal VLA analysis and vault generation completed successfully!');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  return {
    objects: allObjects,
    topology,
    vaultFiles,
    canvas,
    tokenEstimates,
  };
}

if (require.main === module) {
  runMultimodalVLADemo().catch(console.error);
}

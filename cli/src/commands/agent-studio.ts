import { AgentStudioEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import type { VisualNodeType } from '@autonomous-lifecycle-protocol-alp/parser';

export function agentStudioCommand(sub: string, args: string[] = [], options: Record<string, string> = {}) {
  const engine = new AgentStudioEngine();

  switch (sub) {
    case 'create': {
      const name = args[0] || 'my-agent';
      const templateId = options.template;
      let project;
      if (templateId) {
        const templates = engine.listTemplates();
        const tpl = templates.find(t => t.templateId === templateId || t.name.toLowerCase().includes(templateId.toLowerCase()));
        project = engine.createProject(name, tpl ? tpl.templateId : templateId);
      } else {
        project = engine.createProject(name);
      }

      console.log('\n🎨 ALP Agent Studio — Project Created');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`  Project ID:   ${project.projectId}`);
      console.log(`  Name:         ${project.name}`);
      console.log(`  Template:     ${project.template ?? 'Blank'}${templateId ? ` (${templateId})` : ''}`);
      console.log(`  Nodes:        ${project.nodes.length}`);
      console.log(`  Edges:        ${project.edges.length}`);
      console.log(`  Version:      ${project.version}`);
      console.log(`  Created:      ${project.createdAt}`);

      if (project.nodes.length > 0) {
        console.log('\n  📦 Nodes:');
        for (const node of project.nodes) {
          console.log(`    • [${node.type}] ${node.label} (${node.id})`);
        }
        console.log('\n  🔗 Edges:');
        for (const edge of project.edges) {
          console.log(`    • ${edge.from} → ${edge.to}`);
        }
      }
      console.log('');
      break;
    }

    case 'add-node': {
      const projectName = args[0] || 'demo';
      const nodeType = (args[1] || 'TASK').toUpperCase() as VisualNodeType;
      const label = args[2] || 'New Node';

      const project = engine.createProject(projectName);
      const node = engine.addNode(project.projectId, nodeType, label);

      console.log('\n📦 Node Added to Studio Project');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`  Project:    ${project.name}`);
      console.log(`  Node ID:    ${node.id}`);
      console.log(`  Type:       ${node.type}`);
      console.log(`  Label:      ${node.label}`);
      console.log(`  Position:   (${node.x}, ${node.y})\n`);
      break;
    }

    case 'connect': {
      const projectName = args[0] || 'demo';
      const project = engine.createProject(projectName, 'tpl-coder');
      const nodes = project.nodes;

      if (nodes.length >= 2) {
        const edge = engine.addEdge(project.projectId, nodes[0].id, nodes[1].id, options.label);
        console.log('\n🔗 Edge Created in Studio Project');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  Project:    ${project.name}`);
        console.log(`  Edge ID:    ${edge.id}`);
        console.log(`  From:       ${edge.from}`);
        console.log(`  To:         ${edge.to}`);
        if (edge.label) console.log(`  Label:      ${edge.label}`);
        console.log('');
      } else {
        console.log('Not enough nodes to connect.');
      }
      break;
    }

    case 'validate': {
      const projectName = args[0] || 'demo';
      const project = engine.createProject(projectName, 'tpl-fullstack');
      const result = engine.validateDAG(project.projectId);

      console.log('\n✅ DAG Validation Report');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`  Project:    ${project.name}`);
      console.log(`  Valid:      ${result.valid ? 'YES ✓' : 'NO ✗'}`);
      console.log(`  Nodes:      ${result.nodeCount}`);
      console.log(`  Edges:      ${result.edgeCount}`);

      if (result.errors.length > 0) {
        console.log('\n  ❌ Errors:');
        for (const e of result.errors) console.log(`    • ${e}`);
      }
      if (result.warnings.length > 0) {
        console.log('\n  ⚠️  Warnings:');
        for (const w of result.warnings) console.log(`    • ${w}`);
      }
      if (result.topologicalOrder) {
        console.log(`\n  📊 Topological Order: ${result.topologicalOrder.join(' → ')}`);
      }
      console.log('');
      break;
    }

    case 'export': {
      const projectName = args[0] || 'demo';
      const project = engine.createProject(projectName, 'tpl-coder');
      const alp = engine.exportProject(project.projectId);

      console.log('\n📤 ALP Export');
      console.log('═══════════════════════════════════════════════════════');
      console.log(alp);
      console.log('');
      break;
    }

    case 'templates': {
      const templates = engine.listTemplates();
      console.log('\n📋 ALP Agent Studio — Built-in Templates');
      console.log('═══════════════════════════════════════════════════════\n');
      for (const t of templates) {
        console.log(`  🏗️  ${t.name} (${t.templateId})`);
        console.log(`     ${t.description}`);
        console.log(`     Category: ${t.category} | Nodes: ${t.nodes.length} | Edges: ${t.edges.length}\n`);
      }
      break;
    }

    case 'capabilities': {
      const category = options.category;
      const caps = engine.listCapabilities(category);
      console.log('\n🧩 ALP Agent Studio — Capability Marketplace');
      console.log('═══════════════════════════════════════════════════════\n');
      for (const c of caps) {
        const stars = '★'.repeat(Math.round(c.rating)) + '☆'.repeat(5 - Math.round(c.rating));
        console.log(`  ${c.name} (${c.capabilityId})`);
        console.log(`     ${c.description}`);
        console.log(`     Category: ${c.category} | Provider: ${c.provider} | v${c.version}`);
        console.log(`     Rating: ${stars} (${c.rating.toFixed(1)}) | Downloads: ${c.downloads.toLocaleString()}\n`);
      }
      break;
    }

    default:
      console.error(`Unknown agent-studio subcommand: ${sub}`);
      console.error('Available: create, add-node, connect, validate, export, templates, capabilities');
      process.exit(1);
  }
}

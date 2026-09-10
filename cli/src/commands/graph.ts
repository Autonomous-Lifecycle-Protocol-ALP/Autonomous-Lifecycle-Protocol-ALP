import fs from 'fs';
import path from 'path';
import { AlpParser, AlpGraph, AlpError } from '@autonomous-lifecycle-protocol-alp/parser';

export interface GraphOptions {
  mermaid?: boolean;
  json?: boolean;
}

export function graphCommand(filePath?: string, options?: GraphOptions) {
  const parser = new AlpParser();
  const graph = new AlpGraph();
  
  let objects: any[] = [];

  try {
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf8');
      objects = parser.parseAndValidate(content);
    } else {
      const targetDir = path.join(process.cwd(), '.alp');
      if (!fs.existsSync(targetDir)) {
        console.error('Error: .alp directory not found. Run `alp init` first.');
        process.exit(1);
      }
      
      const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.alp'));
      for (const file of files) {
        const fullPath = path.join(targetDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        objects = objects.concat(parser.parseAndValidate(content));
      }
    }
    
    graph.buildGraph(objects);
    
    // Check for cycles
    let isCyclic = false;
    let cycleError = '';
    try {
      graph.detectCycles();
    } catch (err: any) {
      isCyclic = true;
      cycleError = err.message;
    }

    if (options?.json) {
      const jsonOutput = {
        nodes: objects.map(o => ({ id: o.id, type: o._type, status: o.status })),
        edges: graph.edges,
        isCyclic,
        cycleError: isCyclic ? cycleError : undefined,
      };
      console.log(JSON.stringify(jsonOutput, null, 2));
      return;
    }

    if (options?.mermaid) {
      const lines: string[] = ['```mermaid', 'graph TD'];
      objects.forEach(obj => {
        const safeId = obj.id.replace(/[^a-zA-Z0-9_]/g, '_');
        const rawStatus = (obj.status || '[ ]').replace(/[[\]]/g, '');
        lines.push(`  ${safeId}["@${obj._type}: ${obj.id}<br/>(${rawStatus})"]`);
      });
      graph.edges.forEach(edge => {
        const from = edge.source.replace(/[^a-zA-Z0-9_]/g, '_');
        const to = edge.target.replace(/[^a-zA-Z0-9_]/g, '_');
        lines.push(`  ${from} -->|${edge.type}| ${to}`);
      });
      lines.push('```');
      console.log(lines.join('\n'));
      return;
    }

    if (isCyclic) {
      console.error(`[FAIL] Graph validation failed: ${cycleError}`);
      process.exit(1);
    }

    console.log('\n[PKG] ALP Dependency Graph');
    console.log('=======================\n');
    const tree = graph.toTextTree();
    if (tree) {
      console.log(tree);
    } else {
      console.log('(Graph is empty or no valid dependencies found.)');
    }
    console.log(`\nTotal objects: ${objects.length}, Total edges: ${graph.edges.length}\n`);
    
  } catch (err: any) {
    if (err instanceof AlpError) {
      console.error(`[FAIL] Parse Error: ${err.message}`);
    } else {
      console.error(`[FAIL] Unexpected Error: ${err.message}`);
    }
    process.exit(1);
  }
}

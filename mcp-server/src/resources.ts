import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema, SubscribeRequestSchema, UnsubscribeRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import { PolicyEnforcer } from '@autonomous-lifecycle-protocol-alp/sdk';
import { loadWorkspace } from './workspace';
import { subscribers, startSubscriptionPolling, stopSubscriptionPolling } from './subscriptions';
import * as fs from 'fs';
import * as path from 'path';

export function listResourcesHandler(server: Server) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const cwd = process.cwd();
    const alpDir = path.join(cwd, '.alp');
    const resources: any[] = [
      { uri: 'alp://workspace', name: 'ALP Workspace Index', mimeType: 'application/json', description: 'Full list of workspace objects' },
      { uri: 'alp://graph', name: 'ALP Dependency Graph', mimeType: 'application/json', description: 'Topological execution graph' },
      { uri: 'alp://policies', name: 'ALP Governance Policies', mimeType: 'application/json', description: 'Policy rules and compliance audit' },
      { uri: 'alp://events', name: 'ALP Runtime Event Log', mimeType: 'application/json', description: 'Real-time activity log stream' },
    ];
    
    if (fs.existsSync(alpDir)) {
      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(fullPath);
          else if (fullPath.endsWith('.alp')) {
            resources.push({
              uri: `file://${fullPath}`,
              name: path.relative(cwd, fullPath),
              mimeType: 'text/plain'
            });
          }
        }
      };
      walk(alpDir);
    }
    
    return { resources };
  });
}

export function readResourceHandler(server: Server) {
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const cwd = process.cwd();

    if (uri === 'alp://workspace') {
      const objects = loadWorkspace(cwd);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(objects, null, 2) }] };
    }

    if (uri === 'alp://graph') {
      const objects = loadWorkspace(cwd);
      const graph = new AlpGraph();
      graph.buildGraph(objects);
      const order = graph.topologicalSort();
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(order, null, 2) }] };
    }

    if (uri === 'alp://policies') {
      const objects = loadWorkspace(cwd);
      const enforcer = new PolicyEnforcer({ requiredFields: ['id', '_type'] });
      const auditResult = enforcer.govern({ objects } as any);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(auditResult, null, 2) }] };
    }

    if (uri === 'alp://events') {
      const logFile = path.join(cwd, '.alp', '.runtime', 'log.jsonl');
      const content = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '[]';
      return { contents: [{ uri, mimeType: 'application/json', text: content }] };
    }

    if (uri.startsWith('file://')) {
      const filePath = uri.substring(7);
      if (fs.existsSync(filePath)) {
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: fs.readFileSync(filePath, 'utf8')
          }]
        };
      }
    }
    throw new Error(`Resource not found: ${uri}`);
  });
}

export function subscriptionHandlers(server: Server) {
  server.setRequestHandler(SubscribeRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (!subscribers.has(uri)) {
      subscribers.set(uri, new Set());
    }
    subscribers.get(uri)!.add(() => {});
    startSubscriptionPolling(process.cwd());
    return {};
  });

  server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
    const uri = request.params.uri;
    const cbs = subscribers.get(uri);
    if (cbs) {
      cbs.clear();
      subscribers.delete(uri);
    }
    if (subscribers.size === 0) {
      stopSubscriptionPolling();
    }
    return {};
  });
}

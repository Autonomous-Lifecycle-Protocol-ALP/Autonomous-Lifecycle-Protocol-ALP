import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { toolDefinitions as workspaceDefinitions, callTool as workspaceCallTool } from './workspace-tools';
import { toolDefinitions as taskDefinitions, callTool as taskCallTool } from './task-tools';
import { toolDefinitions as governanceDefinitions, callTool as governanceCallTool } from './governance-tools';
import { toolDefinitions as registryDefinitions, callTool as registryCallTool } from './registry-tools';
import { toolDefinitions as contractDefinitions, callTool as contractCallTool } from './contract-tools';
import { toolDefinitions as macroMemoryDefinitions, callTool as macroMemoryCallTool } from './macro-memory-tools';
import { toolDefinitions as ideDefinitions, callTool as ideCallTool } from './ide-tools';
import { toolDefinitions as collabDefinitions, callTool as collabCallTool } from './collab-tools';
import { toolDefinitions as intelligenceDefinitions, callTool as intelligenceCallTool } from './intelligence-tools';
import { toolDefinitions as autonomyDefinitions, callTool as autonomyCallTool } from './autonomy-tools';
import { toolDefinitions as multimodalDefinitions, callTool as multimodalCallTool } from './multimodal-tools';
import { toolDefinitions as synapseDefinitions, callTool as synapseCallTool } from './synapse-tools';

export function listToolsHandler(server: Server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      ...workspaceDefinitions,
      ...taskDefinitions,
      ...governanceDefinitions,
      ...registryDefinitions,
      ...contractDefinitions,
      ...macroMemoryDefinitions,
      ...ideDefinitions,
      ...collabDefinitions,
      ...intelligenceDefinitions,
      ...autonomyDefinitions,
      ...multimodalDefinitions,
      ...synapseDefinitions,
    ],
  }));
}

const handlerMap: Record<string, (name: string, args: Record<string, any>, cwd: string) => any> = {
  ...Object.fromEntries(workspaceDefinitions.map(d => [d.name, workspaceCallTool])),
  ...Object.fromEntries(taskDefinitions.map(d => [d.name, taskCallTool])),
  ...Object.fromEntries(governanceDefinitions.map(d => [d.name, governanceCallTool])),
  ...Object.fromEntries(registryDefinitions.map(d => [d.name, registryCallTool])),
  ...Object.fromEntries(contractDefinitions.map(d => [d.name, contractCallTool])),
  ...Object.fromEntries(macroMemoryDefinitions.map(d => [d.name, macroMemoryCallTool])),
  ...Object.fromEntries(ideDefinitions.map(d => [d.name, ideCallTool])),
  ...Object.fromEntries(collabDefinitions.map(d => [d.name, collabCallTool])),
  ...Object.fromEntries(intelligenceDefinitions.map(d => [d.name, intelligenceCallTool])),
  ...Object.fromEntries(autonomyDefinitions.map(d => [d.name, autonomyCallTool])),
  ...Object.fromEntries(multimodalDefinitions.map(d => [d.name, multimodalCallTool])),
  ...Object.fromEntries(synapseDefinitions.map(d => [d.name, synapseCallTool])),
};

export function callToolHandler(server: Server) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const cwd = (args?.cwd as string) || process.cwd();

    const handler = handlerMap[name];
    if (handler) {
      return handler(name, args as Record<string, any>, cwd);
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  });
}

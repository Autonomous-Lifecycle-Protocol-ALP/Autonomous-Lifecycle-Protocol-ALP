import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_get_contracts',
    description: 'List all @contract objects and their allow/deny rules.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Optional contract ID to filter by' },
        cwd: { type: 'string' }
      }
    }
  },
  {
    name: 'alp_get_vaults',
    description: 'List all @vault objects and their recipient/algorithm metadata.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Optional vault ID to filter by' },
        cwd: { type: 'string' }
      }
    }
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_get_contracts': {
      const objects = loadWorkspace(cwd);
      const contracts = objects.filter((o) => o._type === 'contract');
      const contractId = args?.id as string | undefined;
      const filtered = contractId
        ? contracts.filter((c) => c.id === contractId)
        : contracts;
      const results = filtered.map((c: any) => ({
        id: c.id,
        from: c.from || null,
        to: c.to || null,
        allows: c.allows || [],
        denies: c.denies || [],
        requires: c.requires || [],
        on_violation: c.on_violation || null,
        description: c.description || '',
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }

    case 'alp_get_vaults': {
      const objects = loadWorkspace(cwd);
      const vaults = objects.filter((o) => o._type === 'vault');
      const vaultId = args?.id as string | undefined;
      const filtered = vaultId
        ? vaults.filter((v) => v.id === vaultId)
        : vaults;
      const results = filtered.map((v: any) => ({
        id: v.id,
        algorithm: v.algorithm || 'X25519+AES-256-GCM',
        recipients: (v.recipients || []).map((r: any) => ({
          id: r.id || r,
          algorithm: r.algorithm || 'X25519',
        })),
        description: v.description || '',
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }

    default:
      return null;
  }
}

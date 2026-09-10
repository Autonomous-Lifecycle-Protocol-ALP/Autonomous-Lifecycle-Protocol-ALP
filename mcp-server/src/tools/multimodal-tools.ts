import { MultiModalEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_multimodal_inspect',
    description: 'Inspect multimodal specs, action spaces, and vision models (v82.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        json: { type: 'boolean', description: 'Output results as JSON' },
      },
      required: [],
    },
  },
  {
    name: 'alp_multimodal_validate',
    description: 'Validate multimodal specification integrity and asset hashes (v82.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: [],
    },
  },
  {
    name: 'alp_action_space_check',
    description: 'Check action space safety levels and guard constraints (v82.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        id: { type: 'string', description: 'Optional action space ID to filter by' },
      },
      required: [],
    },
  },
  {
    name: 'alp_token_cost',
    description: 'Estimate token costs for multimodal assets and vision models (v82.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        modalities: { type: 'string', description: 'Comma-separated modalities (vision,audio,sensor,text,spatial)' },
        json: { type: 'boolean', description: 'Output results as JSON' },
      },
      required: [],
    },
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_multimodal_inspect': {
      const objects = loadWorkspace(cwd);
      const engine = new MultiModalEngine();
      const bridge = new MultiModalBridge();
      const mmObjects = objects.filter((o) => o._type === 'multimodal') as any[];
      const actionSpaces = objects.filter((o) => o._type === 'action_space') as any[];
      const visionModels = objects.filter((o) => o._type === 'vision_model') as any[];

      if (args?.json) {
        return {
          content: [{ type: 'text', text: JSON.stringify({
            multimodal: mmObjects.map(mm => ({
              id: mm.id,
              modalities: mm.modalities || [],
              assets: (mm.assets || []).length,
              tokens: bridge.estimateContextBudget(mm, visionModels[0]).totalTokens,
            })),
            actionSpaces: actionSpaces.map(as => ({
              id: as.id,
              domain: as.domain,
              actions: (as.actions || []).length,
              validation: engine.validateActionSpace(as),
            })),
            visionModels: visionModels.map(vm => ({
              id: vm.id,
              backbone: vm.backbone,
              contextTokens: vm.context_tokens || 4096,
            })),
          }, null, 2) }],
        };
      }

      const lines: string[] = ['═══════════════════════════════════════════════════════════'];
      lines.push('👁️  ALP MULTI-MODAL & VLA INSPECTION (v82.0.0)');
      lines.push('═══════════════════════════════════════════════════════════\n');
      lines.push(`[MULTIMODAL SPECS] Found ${mmObjects.length} specs`);
      for (const mm of mmObjects) {
        const budget = bridge.estimateContextBudget(mm, visionModels[0]);
        lines.push(`  • ID: ${mm.id}`);
        lines.push(`    - Modalities:   ${(mm.modalities || []).join(', ') || 'none'}`);
        lines.push(`    - Assets:       ${(mm.assets || []).length} items`);
        lines.push(`    - Est. Tokens:  ${budget.totalTokens} tokens (~${budget.budgetPercent.toFixed(1)}% of budget)`);
      }
      lines.push(`\n[ACTION SPACES] Found ${actionSpaces.length} action spaces`);
      for (const as of actionSpaces) {
        const validation = engine.validateActionSpace(as);
        lines.push(`  • ID: ${as.id} (Agent: ${as.agent || 'global'}, Domain: ${as.domain || 'general'})`);
        lines.push(`    - Actions:      ${(as.actions || []).length}`);
        lines.push(`    - Critical:     ${validation.criticalActionCount}`);
        for (const a of (as.actions || [])) {
          if (typeof a === 'string') {
            lines.push(`       → ${a}`);
          } else {
            lines.push(`       → ${a.name} [${(a.safety_level || 'low').toUpperCase()}] (${a.type || 'digital'})`);
          }
        }
      }
      lines.push(`\n[VISION MODELS] Found ${visionModels.length} models`);
      for (const vm of visionModels) {
        lines.push(`  • ID: ${vm.id} (Backbone: ${vm.backbone}, Context: ${vm.context_tokens || 4096} tokens)`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    case 'alp_multimodal_validate': {
      const objects = loadWorkspace(cwd);
      const engine = new MultiModalEngine();
      const mmObjects = objects.filter((o) => o._type === 'multimodal') as any[];

      const lines: string[] = [];
      lines.push(`[MULTIMODAL] Validating ${mmObjects.length} multimodal specifications...`);
      let errorCount = 0;
      for (const mm of mmObjects) {
        const result = engine.validateMultimodal(mm);
        if (!result.valid) {
          lines.push(`  ❌ Spec '${mm.id}' failed validation:`);
          for (const err of result.errors) lines.push(`     - ${err}`);
          errorCount++;
        } else {
          lines.push(`  ✅ Spec '${mm.id}' valid (${result.totalTokensEstimate} est. tokens)`);
        }
      }
      if (errorCount > 0) {
        lines.push(`\n[MULTIMODAL] Validation failed with ${errorCount} error(s).`);
        return { content: [{ type: 'text', text: lines.join('\n') }], isError: true };
      }
      lines.push(`\n[MULTIMODAL] All multimodal specs are valid!`);
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    case 'alp_action_space_check': {
      const objects = loadWorkspace(cwd);
      const engine = new MultiModalEngine();
      const actionSpaces = objects.filter((o) => o._type === 'action_space') as any[];
      const targetId = args?.id as string | undefined;
      const targetSpaces = targetId ? actionSpaces.filter((as) => as.id === targetId) : actionSpaces;

      if (targetSpaces.length === 0) {
        return { content: [{ type: 'text', text: `Error: No action spaces found${targetId ? ` matching '${targetId}'` : ''}.` }], isError: true };
      }

      const lines: string[] = [];
      lines.push(`[ACTION SPACE] Checking ${targetSpaces.length} action spaces for safety compliance...`);
      let hasBlocked = false;
      for (const as of targetSpaces) {
        const val = engine.validateActionSpace(as);
        const guards = engine.verifySafetyGuards(as, as.safety_guards || []);
        lines.push(`\n  • Space: ${as.id}`);
        lines.push(`    - Actions: ${(as.actions || []).length}`);
        lines.push(`    - Critical Actions: ${val.criticalActionCount}`);
        if (guards.blockedActions.length > 0) {
          lines.push(`    ⚠️ BLOCKED ACTIONS (Missing safety guards or confirmation):`);
          for (const b of guards.blockedActions) lines.push(`       - ${b}`);
          hasBlocked = true;
        } else {
          lines.push(`    ✅ All actions safe and verified with active safety guards.`);
        }
      }
      if (hasBlocked) {
        lines.push(`\n[ACTION SPACE] Notice: Unconfirmed critical actions detected.`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    case 'alp_token_cost': {
      const objects = loadWorkspace(cwd);
      const engine = new MultiModalEngine();
      const mmObjects = objects.filter((o) => o._type === 'multimodal') as any[];
      const visionModels = objects.filter((o) => o._type === 'vision_model') as any[];
      const modalities = ((args?.modalities as string) || '').split(',').map((m) => m.trim()).filter(Boolean);
      const visionModel = visionModels[0];

      if (mmObjects.length === 0) {
        return { content: [{ type: 'text', text: 'Error: No multimodal specs found in workspace.' }], isError: true };
      }

      const results = mmObjects.map((mm) => {
        const activeModalities = modalities.length > 0 ? modalities : (mm.modalities || []);
        const totalTokens = engine.estimateTokenCost(activeModalities, mm.assets || [], visionModel);
        return {
          id: mm.id,
          modalities: activeModalities,
          totalTokens,
        };
      });

      if (args?.json) {
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }

      const lines: string[] = ['💰 TOKEN COST ESTIMATION'];
      lines.push('═══════════════════════════════════════════════════════════');
      for (const r of results) {
        const maxContext = visionModel?.context_tokens || 8192;
        const percent = Math.min(100, (r.totalTokens / maxContext) * 100);
        lines.push(`\n  • ${r.id}`);
        lines.push(`    - Modalities:   ${r.modalities.join(', ') || 'none'}`);
        lines.push(`    - Est. Tokens:  ${r.totalTokens}`);
        lines.push(`    - Context Use:  ${percent.toFixed(1)}% of ${maxContext} tokens`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    default:
      return null;
  }
}

import * as fs from 'fs';
import * as path from 'path';
import {
  AlpParser,
  AlpObject,
  MultiModalEngine,
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';

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

export function multimodalInspectCommand(options: { id?: string; json?: boolean }) {
  const objects = loadAllObjects();
  const mmObjects = objects.filter((o) => o._type === 'multimodal') as unknown as AlpMultimodal[];
  const actionSpaces = objects.filter((o) => o._type === 'action_space') as unknown as AlpActionSpace[];
  const visionModels = objects.filter((o) => o._type === 'vision_model') as unknown as AlpVisionModel[];

  const engine = new MultiModalEngine();
  const bridge = new MultiModalBridge();

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          multimodal: mmObjects,
          actionSpaces,
          visionModels,
        },
        null,
        2
      )
    );
    return;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('👁️  ALP MULTI-MODAL & VLA INSPECTION (v82.0.0)');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`[MULTIMODAL SPECS] Found ${mmObjects.length} specs`);
  for (const mm of mmObjects) {
    const budget = bridge.estimateContextBudget(mm, visionModels[0]);
    console.log(`  • ID: ${mm.id}`);
    console.log(`    - Modalities:   ${mm.modalities ? mm.modalities.join(', ') : 'none'}`);
    console.log(`    - Assets:       ${mm.assets ? mm.assets.length : 0} items`);
    console.log(`    - Est. Tokens:  ${budget.totalTokens} tokens (~${budget.budgetPercent.toFixed(1)}% of budget)`);
  }

  console.log(`\n[ACTION SPACES] Found ${actionSpaces.length} action spaces`);
  for (const as of actionSpaces) {
    const validation = engine.validateActionSpace(as);
    console.log(`  • ID: ${as.id} (Agent: ${as.agent || 'global'}, Domain: ${as.domain || 'general'})`);
    console.log(`    - Actions:      ${as.actions ? as.actions.length : 0}`);
    console.log(`    - Critical:     ${validation.criticalActionCount}`);
    for (const a of as.actions || []) {
      console.log(`       → ${a.name} [${a.safety_level.toUpperCase()}] (${a.type})`);
    }
  }

  console.log(`\n[VISION MODELS] Found ${visionModels.length} models`);
  for (const vm of visionModels) {
    console.log(`  • ID: ${vm.id} (Backbone: ${vm.backbone}, Context: ${vm.context_tokens || 4096} tokens)`);
  }
}

export function multimodalValidateCommand() {
  const objects = loadAllObjects();
  const mmObjects = objects.filter((o) => o._type === 'multimodal') as unknown as AlpMultimodal[];
  const engine = new MultiModalEngine();

  console.log(`[MULTIMODAL] Validating ${mmObjects.length} multimodal specifications...`);
  let errorCount = 0;

  for (const mm of mmObjects) {
    const result = engine.validateMultimodal(mm);
    if (!result.valid) {
      console.error(`  ❌ Spec '${mm.id}' failed validation:`);
      for (const err of result.errors) console.error(`     - ${err}`);
      errorCount++;
    } else {
      console.log(`  ✅ Spec '${mm.id}' valid (${result.totalTokensEstimate} est. tokens)`);
    }
  }

  if (errorCount > 0) {
    console.error(`\n[MULTIMODAL] Validation failed with ${errorCount} error(s).`);
    process.exit(1);
  } else {
    console.log(`\n[MULTIMODAL] All multimodal specs are valid!`);
  }
}

export function actionSpaceCheckCommand(actionSpaceId?: string) {
  const objects = loadAllObjects();
  const actionSpaces = objects.filter((o) => o._type === 'action_space') as unknown as AlpActionSpace[];
  const engine = new MultiModalEngine();

  const targetSpaces = actionSpaceId
    ? actionSpaces.filter((as) => as.id === actionSpaceId)
    : actionSpaces;

  if (targetSpaces.length === 0) {
    console.error(`Error: No action spaces found${actionSpaceId ? ` matching '${actionSpaceId}'` : ''}.`);
    process.exit(1);
  }

  console.log(`[ACTION SPACE] Checking ${targetSpaces.length} action spaces for safety compliance...`);
  let hasBlocked = false;

  for (const as of targetSpaces) {
    const val = engine.validateActionSpace(as);
    const guards = engine.verifySafetyGuards(as, as.safety_guards || []);

    console.log(`\n  • Space: ${as.id}`);
    console.log(`    - Actions: ${as.actions ? as.actions.length : 0}`);
    console.log(`    - Critical Actions: ${val.criticalActionCount}`);

    if (guards.blockedActions.length > 0) {
      console.warn(`    ⚠️ BLOCKED ACTIONS (Missing safety guards or confirmation):`);
      for (const b of guards.blockedActions) console.warn(`       - ${b}`);
      hasBlocked = true;
    } else {
      console.log(`    ✅ All actions safe and verified with active safety guards.`);
    }
  }

  if (hasBlocked) {
    console.log(`\n[ACTION SPACE] Notice: Unconfirmed critical actions detected.`);
  }
}

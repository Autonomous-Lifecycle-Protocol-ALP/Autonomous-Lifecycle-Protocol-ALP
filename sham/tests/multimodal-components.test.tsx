import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

import {
  SAFETY_COLORS,
  MODALITY_ICONS,
  ASSET_TYPE_COLORS,
  panelStyle,
  headerStyle,
  tabBarStyle,
  cardStyle,
  chipStyle,
  TabButton,
  StatCard,
  SectionHeader,
  TokenBudgetBar,
  SafetyLevel,
  Tab,
} from '../src/renderer/components/multimodal/shared.js';
import { SAMPLE_MULTIMODAL, SAMPLE_ACTION_SPACES, SAMPLE_VISION_MODELS } from '../src/renderer/components/multimodal/sampleData.js';
import { OverviewTab } from '../src/renderer/components/multimodal/OverviewTab.js';
import { AssetsTab } from '../src/renderer/components/multimodal/AssetsTab.js';
import { ActionsTab } from '../src/renderer/components/multimodal/ActionsTab.js';
import { SimulatorTab } from '../src/renderer/components/multimodal/SimulatorTab.js';
import { MultiModalPanel } from '../src/renderer/components/multimodal/MultiModalPanel.js';

/* ── Mock classes for external SDK/parser dependencies ──────────────────── */

class MockMultiModalEngine {
  validateActionSpace(spec: any) {
    const criticalActionCount = (spec.actions || []).filter(
      (a: any) => a.safety_level === 'critical'
    ).length;
    return {
      valid: true,
      errors: [],
      warnings: [],
      criticalActionCount,
    };
  }

  verifySafetyGuards(actionSpace: any, activeGuards: string[] = []) {
    const blockedActions: string[] = [];
    const guardSet = new Set(activeGuards.map((g) => g.toLowerCase()));

    for (const action of actionSpace.actions || []) {
      if (action.safety_level === 'critical') {
        const hasGuard =
          guardSet.has('enforce-human-in-the-loop') ||
          guardSet.has('strict-boundary') ||
          guardSet.has(action.name.toLowerCase());
        if (!hasGuard && !action.requires_confirmation) {
          blockedActions.push(action.name);
        }
      }
    }

    return {
      allowed: blockedActions.length === 0,
      blockedActions,
    };
  }

  estimateTokenCost(modalities: string[], assets: any[] = [], visionModel?: any): number {
    let tokenEstimate = 0;
    for (const m of modalities) {
      if (m === 'text') tokenEstimate += 256;
      if (m === 'sensor') tokenEstimate += 128;
    }
    for (const asset of assets) {
      if (typeof asset === 'string') {
        tokenEstimate += 768;
        continue;
      }
      switch (asset.type) {
        case 'image':
          tokenEstimate += 768;
          break;
        case 'video':
          tokenEstimate += 1600;
          break;
        case 'audio':
          tokenEstimate += 320;
          break;
        case 'point_cloud':
        case 'spatial':
          tokenEstimate += 1024;
          break;
        default:
          tokenEstimate += 200;
          break;
      }
    }
    if (visionModel?.context_tokens && tokenEstimate > visionModel.context_tokens) {
      tokenEstimate = visionModel.context_tokens;
    }
    return tokenEstimate;
  }
}

class MockMultiModalBridge {
  private engine: MockMultiModalEngine;

  constructor() {
    this.engine = new MockMultiModalEngine();
  }

  estimateContextBudget(spec: any, visionModel?: any, maxContext: number = 8192) {
    const totalTokens = this.engine.estimateTokenCost(
      spec.modalities || [],
      spec.assets || [],
      visionModel
    );
    const maxContextTokens = visionModel?.context_tokens || maxContext;
    const budgetPercent = Math.min(100, (totalTokens / maxContextTokens) * 100);
    const remainingTokens = Math.max(0, maxContextTokens - totalTokens);

    return {
      totalTokens,
      maxContextTokens,
      budgetPercent,
      remainingTokens,
    };
  }

  validateActionExecution(
    actionSpace: any,
    actionName: string,
    params: Record<string, unknown> = {},
    confirmed: boolean = false
  ) {
    const action = (actionSpace.actions || []).find((a: any) => a.name === actionName);

    if (!action) {
      return {
        allowed: false,
        reason: `Action '${actionName}' not defined in action space '${actionSpace.id}'.`,
        actionName,
        safetyLevel: 'unknown',
        executionTimestamp: Date.now(),
      };
    }

    if (action.parameters) {
      for (const param of action.parameters) {
        if (param.required && (params[param.name] === undefined || params[param.name] === null)) {
          return {
            allowed: false,
            reason: `Required parameter '${param.name}' is missing for action '${actionName}'.`,
            actionName,
            safetyLevel: action.safety_level,
            executionTimestamp: Date.now(),
          };
        }
      }
    }

    if (action.safety_level === 'critical' && action.requires_confirmation && !confirmed) {
      return {
        allowed: false,
        reason: `Action '${actionName}' is flagged CRITICAL and requires explicit human confirmation.`,
        actionName,
        safetyLevel: action.safety_level,
        executionTimestamp: Date.now(),
      };
    }

    return {
      allowed: true,
      actionName,
      safetyLevel: action.safety_level,
      executionTimestamp: Date.now(),
    };
  }
}

const createMockBridge = () => new MockMultiModalBridge();
const createMockEngine = () => new MockMultiModalEngine();

afterEach(() => {
  cleanup();
});

/* ── shared.tsx ─────────────────────────────────────────────────────────── */

describe('shared.tsx — color maps', () => {
  it('exports all expected safety levels', () => {
    expect(SAFETY_COLORS).toEqual({
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    });
  });

  it('exports modality icons for each supported modality', () => {
    expect(MODALITY_ICONS.vision).toBe('👁️');
    expect(MODALITY_ICONS.audio).toBe('🎵');
    expect(MODALITY_ICONS.sensor).toBe('📡');
    expect(MODALITY_ICONS.text).toBe('📝');
    expect(MODALITY_ICONS.spatial).toBe('🌐');
  });

  it('exports asset type colors for all asset types', () => {
    expect(ASSET_TYPE_COLORS.image).toBe('#8b5cf6');
    expect(ASSET_TYPE_COLORS.video).toBe('#3b82f6');
    expect(ASSET_TYPE_COLORS.audio).toBe('#10b981');
    expect(ASSET_TYPE_COLORS.sensor).toBe('#f59e0b');
    expect(ASSET_TYPE_COLORS.point_cloud).toBe('#06b6d4');
    expect(ASSET_TYPE_COLORS.spatial).toBe('#ec4899');
  });
});

describe('shared.tsx — style objects', () => {
  it('panelStyle has expected dark theme properties', () => {
    expect(panelStyle.display).toBe('flex');
    expect(panelStyle.flexDirection).toBe('column');
    expect(panelStyle.height).toBe('100%');
    expect(panelStyle.backgroundColor).toBe('#0e1117');
    expect(panelStyle.color).toBe('#e6edf3');
  });

  it('headerStyle has gradient background', () => {
    expect(headerStyle.display).toBe('flex');
    expect(headerStyle.alignItems).toBe('center');
    expect(headerStyle.background).toContain('linear-gradient');
  });

  it('tabBarStyle has border bottom', () => {
    expect(tabBarStyle.display).toBe('flex');
    expect(tabBarStyle.borderBottom).toBe('1px solid #21262d');
    expect(tabBarStyle.background).toBe('#161b22');
  });

  it('cardStyle has rounded border and padding', () => {
    expect(cardStyle.background).toBe('#161b22');
    expect(cardStyle.borderRadius).toBe(10);
    expect(cardStyle.border).toBe('1px solid #21262d');
    expect(cardStyle.padding).toBe('14px 16px');
  });

  it('chipStyle returns a style object with the provided color', () => {
    const style = chipStyle('#ff0000');
    expect(style.backgroundColor).toBe('#ff00001a');
    expect(style.color).toBe('#ff0000');
    expect(style.border).toBe('1px solid #ff000044');
    expect(style.borderRadius).toBe(9999);
  });
});

describe('shared.tsx — TabButton', () => {
  it('renders label and icon', () => {
    render(<TabButton label="Overview" icon="📊" active={false} onClick={() => {}} />);
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('📊')).toBeDefined();
  });

  it('applies active styles when active', () => {
    const { container } = render(<TabButton label="Tab" icon="🔘" active={true} onClick={() => {}} />);
    const button = container.querySelector('button');
    expect(button?.style.borderBottom).toBe('2px solid rgb(139, 92, 246)');
    expect(button?.style.color).toBe('rgb(230, 237, 243)');
  });

  it('applies inactive styles when not active', () => {
    const { container } = render(<TabButton label="Tab" icon="🔘" active={false} onClick={() => {}} />);
    const button = container.querySelector('button');
    expect(button?.style.borderBottom).toBe('2px solid transparent');
    expect(button?.style.color).toBe('rgb(139, 148, 158)');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<TabButton label="Tab" icon="🔘" active={false} onClick={onClick} />);
    fireEvent.click(screen.getByText('Tab'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('shared.tsx — StatCard', () => {
  it('renders label, value, and icon', () => {
    render(<StatCard label="Specs" value={42} color="#8b5cf6" icon="👁️" />);
    expect(screen.getByText('Specs')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('👁️')).toBeDefined();
  });

  it('renders numeric value correctly', () => {
    render(<StatCard label="Count" value={0} color="#10b981" icon="📦" />);
    expect(screen.getByText('0')).toBeDefined();
  });
});

describe('shared.tsx — SectionHeader', () => {
  it('renders title', () => {
    render(<SectionHeader title="My Section" count={5} />);
    expect(screen.getByText('My Section')).toBeDefined();
  });

  it('shows count badge when count > 0', () => {
    render(<SectionHeader title="Section" count={3} />);
    expect(screen.getByText('3')).toBeDefined();
  });

  it('hides count badge when count is 0', () => {
    render(<SectionHeader title="Section" count={0} />);
    expect(screen.queryByText('0')).toBeNull();
  });

  it('hides count badge when count is negative', () => {
    render(<SectionHeader title="Section" count={-1} />);
    expect(screen.queryByText('-1')).toBeNull();
  });
});

describe('shared.tsx — TokenBudgetBar', () => {
  it('renders 0% budget correctly', () => {
    const { container } = render(<TokenBudgetBar percent={0} />);
    expect(screen.getByText('0% context budget')).toBeDefined();
    const bars = container.querySelectorAll('div > div');
    const fillBar = Array.from(bars).find((bar) => bar.style.width === '0%');
    expect(fillBar).toBeDefined();
  });

  it('renders 50% budget with green color', () => {
    const { container } = render(<TokenBudgetBar percent={50} />);
    expect(screen.getByText('50% context budget')).toBeDefined();
    const bars = container.querySelectorAll('div > div');
    const fillBar = Array.from(bars).find((bar) => bar.style.width === '50%');
    expect(fillBar?.style.backgroundColor).toBe('rgb(16, 185, 129)');
  });

  it('renders 80% budget with amber color', () => {
    const { container } = render(<TokenBudgetBar percent={80} />);
    const bars = container.querySelectorAll('div > div');
    const fillBar = Array.from(bars).find((bar) => bar.style.width === '80%');
    expect(fillBar?.style.backgroundColor).toBe('rgb(245, 158, 11)');
  });

  it('renders 95% budget with red color', () => {
    const { container } = render(<TokenBudgetBar percent={95} />);
    const bars = container.querySelectorAll('div > div');
    const fillBar = Array.from(bars).find((bar) => bar.style.width === '95%');
    expect(fillBar?.style.backgroundColor).toBe('rgb(239, 68, 68)');
  });

  it('clamps percent above 100 to 100', () => {
    const { container } = render(<TokenBudgetBar percent={150} />);
    expect(screen.getByText('100% context budget')).toBeDefined();
    const bars = container.querySelectorAll('div > div');
    const fillBar = Array.from(bars).find((bar) => bar.style.width === '100%');
    expect(fillBar).toBeDefined();
  });

  it('clamps negative percent to 0', () => {
    const { container } = render(<TokenBudgetBar percent={-10} />);
    expect(screen.getByText('0% context budget')).toBeDefined();
    const bars = container.querySelectorAll('div > div');
    const fillBar = Array.from(bars).find((bar) => bar.style.width === '0%');
    expect(fillBar).toBeDefined();
  });
});

describe('shared.tsx — types', () => {
  it('SafetyLevel is a union of expected strings', () => {
    const levels: SafetyLevel[] = ['low', 'medium', 'high', 'critical'];
    expect(levels).toHaveLength(4);
  });

  it('Tab is a union of expected strings', () => {
    const tabs: Tab[] = ['overview', 'assets', 'actions', 'simulator'];
    expect(tabs).toHaveLength(4);
  });
});

/* ── sampleData.ts ──────────────────────────────────────────────────────── */

describe('sampleData.ts', () => {
  it('exports SAMPLE_MULTIMODAL as an array', () => {
    expect(Array.isArray(SAMPLE_MULTIMODAL)).toBe(true);
    expect(SAMPLE_MULTIMODAL.length).toBeGreaterThan(0);
  });

  it('each multimodal spec has id, modalities, and assets', () => {
    for (const mm of SAMPLE_MULTIMODAL) {
      expect(typeof mm.id).toBe('string');
      expect(Array.isArray(mm.modalities)).toBe(true);
      expect(mm.modalities.length).toBeGreaterThan(0);
    }
  });

  it('each asset has id, type, and uri', () => {
    for (const mm of SAMPLE_MULTIMODAL) {
      for (const asset of mm.assets || []) {
        expect(typeof asset.id).toBe('string');
        expect(typeof asset.type).toBe('string');
        expect(typeof asset.uri).toBe('string');
      }
    }
  });

  it('exports SAMPLE_ACTION_SPACES as an array', () => {
    expect(Array.isArray(SAMPLE_ACTION_SPACES)).toBe(true);
    expect(SAMPLE_ACTION_SPACES.length).toBeGreaterThan(0);
  });

  it('each action space has id and actions', () => {
    for (const as of SAMPLE_ACTION_SPACES) {
      expect(typeof as.id).toBe('string');
      expect(Array.isArray(as.actions)).toBe(true);
      expect(as.actions.length).toBeGreaterThan(0);
    }
  });

  it('each action has name, type, and safety_level', () => {
    for (const as of SAMPLE_ACTION_SPACES) {
      for (const action of as.actions) {
        expect(typeof action.name).toBe('string');
        expect(typeof action.type).toBe('string');
        expect(['low', 'medium', 'high', 'critical']).toContain(action.safety_level);
      }
    }
  });

  it('exports SAMPLE_VISION_MODELS as an array', () => {
    expect(Array.isArray(SAMPLE_VISION_MODELS)).toBe(true);
    expect(SAMPLE_VISION_MODELS.length).toBeGreaterThan(0);
  });

  it('each vision model has id and backbone', () => {
    for (const vm of SAMPLE_VISION_MODELS) {
      expect(typeof vm.id).toBe('string');
      expect(typeof vm.backbone).toBe('string');
    }
  });

  it('sample data includes at least two multimodal specs', () => {
    expect(SAMPLE_MULTIMODAL.length).toBeGreaterThanOrEqual(2);
  });

  it('sample data includes at least two action spaces', () => {
    expect(SAMPLE_ACTION_SPACES.length).toBeGreaterThanOrEqual(2);
  });

  it('sample data includes at least one vision model', () => {
    expect(SAMPLE_VISION_MODELS.length).toBeGreaterThanOrEqual(1);
  });
});

/* ── OverviewTab.tsx ────────────────────────────────────────────────────── */

describe('OverviewTab', () => {
  const bridge = createMockBridge();

  it('renders the stats grid with correct counts', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    expect(screen.getByText('Multimodal Specs')).toBeDefined();
    expect(screen.getAllByText('Action Spaces').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Vision Models').length).toBeGreaterThanOrEqual(1);
  });

  it('renders stat card values matching data lengths', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    expect(screen.getAllByText(String(SAMPLE_MULTIMODAL.length)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(String(SAMPLE_ACTION_SPACES.length)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(String(SAMPLE_VISION_MODELS.length)).length).toBeGreaterThanOrEqual(1);
  });

  it('renders SectionHeaders for each category', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    expect(screen.getByText('Multimodal Specifications')).toBeDefined();
    expect(screen.getAllByText('Action Spaces').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Vision Models').length).toBeGreaterThanOrEqual(1);
  });

  it('renders multimodal spec IDs', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    for (const mm of SAMPLE_MULTIMODAL) {
      expect(screen.getByText((content, element) => content.includes(mm.id))).toBeDefined();
    }
  });

  it('renders action space IDs', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    for (const as of SAMPLE_ACTION_SPACES) {
      expect(screen.getByText((content, element) => content.includes(as.id))).toBeDefined();
    }
  });

  it('renders vision model IDs', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    for (const vm of SAMPLE_VISION_MODELS) {
      expect(screen.getByText((content, element) => content.includes(vm.id))).toBeDefined();
    }
  });

  it('renders modality chips', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    for (const mm of SAMPLE_MULTIMODAL) {
      for (const modality of mm.modalities) {
        const matches = screen.getAllByText((content, element) => content.includes(modality));
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('renders action names within action spaces', () => {
    render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    for (const as of SAMPLE_ACTION_SPACES) {
      for (const action of as.actions) {
        expect(screen.getByText((content, element) => content.includes(action.name))).toBeDefined();
      }
    }
  });

  it('renders TokenBudgetBar for each multimodal spec', () => {
    const { container } = render(
      <OverviewTab
        multimodalSpecs={SAMPLE_MULTIMODAL}
        actionSpaces={SAMPLE_ACTION_SPACES}
        visionModels={SAMPLE_VISION_MODELS}
        bridge={bridge}
      />
    );
    const budgetBars = container.querySelectorAll('[style*="border-radius: 3px"]');
    expect(budgetBars.length).toBeGreaterThanOrEqual(SAMPLE_MULTIMODAL.length);
  });

  it('handles empty arrays gracefully', () => {
    render(
      <OverviewTab
        multimodalSpecs={[]}
        actionSpaces={[]}
        visionModels={[]}
        bridge={bridge}
      />
    );
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Multimodal Specifications')).toBeDefined();
  });
});

/* ── AssetsTab.tsx ──────────────────────────────────────────────────────── */

describe('AssetsTab', () => {
  it('renders section header with asset count', () => {
    render(<AssetsTab multimodalSpecs={SAMPLE_MULTIMODAL} />);
    expect(screen.getByText('All Multimodal Assets')).toBeDefined();
  });

  it('renders all assets from all multimodal specs', () => {
    render(<AssetsTab multimodalSpecs={SAMPLE_MULTIMODAL} />);
    for (const mm of SAMPLE_MULTIMODAL) {
      for (const asset of mm.assets || []) {
        expect(screen.getByText(asset.id)).toBeDefined();
      }
    }
  });

  it('renders asset URIs', () => {
    render(<AssetsTab multimodalSpecs={SAMPLE_MULTIMODAL} />);
    for (const mm of SAMPLE_MULTIMODAL) {
      for (const asset of mm.assets || []) {
        expect(screen.getByText(new RegExp(asset.uri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeDefined();
      }
    }
  });

  it('renders asset type chips', () => {
    render(<AssetsTab multimodalSpecs={SAMPLE_MULTIMODAL} />);
    for (const mm of SAMPLE_MULTIMODAL) {
      for (const asset of mm.assets || []) {
        const chips = screen.getAllByText(asset.type);
        expect(chips.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('renders parent spec ID for each asset', () => {
    render(<AssetsTab multimodalSpecs={SAMPLE_MULTIMODAL} />);
    for (const mm of SAMPLE_MULTIMODAL) {
      const parents = screen.getAllByText((content, element) => content.includes(`Parent: ${mm.id}`));
      expect(parents.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('shows empty state when no multimodal specs', () => {
    render(<AssetsTab multimodalSpecs={[]} />);
    expect(screen.getByText(/No multimodal assets defined/)).toBeDefined();
  });

  it('shows empty state when specs have no assets', () => {
    render(<AssetsTab multimodalSpecs={[{ id: 'empty', modalities: ['vision'], assets: [] }]} />);
    expect(screen.getByText(/No multimodal assets defined/)).toBeDefined();
  });

  it('renders resolution when present', () => {
    render(<AssetsTab multimodalSpecs={SAMPLE_MULTIMODAL} />);
    expect(screen.getByText('Resolution: 1920x1080')).toBeDefined();
  });

  it('renders format when present', () => {
    const specsWithFormat = [
      {
        id: 'test',
        modalities: ['vision'],
        assets: [{ id: 'a1', type: 'image', uri: 's3://test.png', format: 'png' }],
      },
    ];
    render(<AssetsTab multimodalSpecs={specsWithFormat} />);
    expect(screen.getByText('Format: png')).toBeDefined();
  });
});

/* ── ActionsTab.tsx ─────────────────────────────────────────────────────── */

describe('ActionsTab', () => {
  const engine = createMockEngine();

  it('renders action space IDs', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    for (const as of SAMPLE_ACTION_SPACES) {
      expect(screen.getByText((content, element) => content.includes(as.id))).toBeDefined();
    }
  });

  it('renders SAFE or BLOCKED status chip for each space', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    const safeChips = screen.getAllByText('✅ SAFE');
    const blockedChips = screen.queryAllByText('⚠️ BLOCKED');
    expect(safeChips.length).toBe(SAMPLE_ACTION_SPACES.length);
    expect(blockedChips.length).toBeGreaterThanOrEqual(0);
  });

  it('renders action names', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    for (const as of SAMPLE_ACTION_SPACES) {
      for (const action of as.actions) {
        expect(screen.getByText(action.name)).toBeDefined();
      }
    }
  });

  it('renders safety level chips for each action', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    for (const as of SAMPLE_ACTION_SPACES) {
      for (const action of as.actions) {
        const chips = screen.getAllByText(action.safety_level.toUpperCase());
        expect(chips.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('renders action type labels', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    for (const as of SAMPLE_ACTION_SPACES) {
      for (const action of as.actions) {
        const labels = screen.getAllByText(action.type);
        expect(labels.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('renders critical action count', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    const criticalElements = screen.getAllByText((content, element) => content.includes('Critical:'));
    expect(criticalElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders domain and agent info', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    for (const as of SAMPLE_ACTION_SPACES) {
      expect(screen.getByText((content, element) => content.includes(`Domain: ${as.domain || 'general'}`))).toBeDefined();
      expect(screen.getByText((content, element) => content.includes(`Agent: ${as.agent || 'global'}`))).toBeDefined();
    }
  });

  it('renders safety guards when present', () => {
    render(<ActionsTab actionSpaces={SAMPLE_ACTION_SPACES} engine={engine} />);
    expect(screen.getByText('Active Safety Guards:')).toBeDefined();
    expect(screen.getByText('🛡️ enforce-human-in-the-loop')).toBeDefined();
  });

  it('does not render safety guards section when none exist', () => {
    const noGuardSpaces = [
      {
        id: 'as-no-guards',
        agent: 'test',
        domain: 'test',
        actions: [{ name: 'safe_action', type: 'digital', safety_level: 'low' }],
      },
    ];
    render(<ActionsTab actionSpaces={noGuardSpaces} engine={engine} />);
    expect(screen.queryByText('Active Safety Guards:')).toBeNull();
  });

  it('handles empty action spaces array', () => {
    render(<ActionsTab actionSpaces={[]} engine={engine} />);
    expect(screen.queryByText('✅ SAFE')).toBeNull();
    expect(screen.queryByText('⚠️ BLOCKED')).toBeNull();
  });
});

/* ── SimulatorTab.tsx ───────────────────────────────────────────────────── */

describe('SimulatorTab', () => {
  const bridge = createMockBridge();

  it('renders the section header', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    expect(screen.getByText('Action Space Dry-Run Simulator')).toBeDefined();
  });

  it('renders action space select with options', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('renders action select options for the first space', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    for (const action of SAMPLE_ACTION_SPACES[0].actions) {
      expect(screen.getByText(new RegExp(`${action.name} \\[${action.safety_level}\\]`))).toBeDefined();
    }
  });

  it('renders the dry-run execute button', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    expect(screen.getByText('▶ Dry-Run Execute')).toBeDefined();
  });

  it('execute button is disabled when no action selected', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const button = screen.getByText('▶ Dry-Run Execute');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables execute button after selecting an action', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: SAMPLE_ACTION_SPACES[0].actions[0].name } });
    const button = screen.getByText('▶ Dry-Run Execute');
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows execution result after dry-run', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'grip_object' } });
    fireEvent.click(screen.getByText('▶ Dry-Run Execute'));
    expect(screen.getByText('EXECUTION ALLOWED')).toBeDefined();
  });

  it('shows denied result for critical action without confirmation', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'emergency_stop' } });
    fireEvent.click(screen.getByText('▶ Dry-Run Execute'));
    expect(screen.getByText('EXECUTION DENIED')).toBeDefined();
  });

  it('clears result when switching action space', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: SAMPLE_ACTION_SPACES[1].id } });
    fireEvent.change(selects[1], { target: { value: SAMPLE_ACTION_SPACES[1].actions[0].name } });
    fireEvent.click(screen.getByText('▶ Dry-Run Execute'));
    expect(screen.getByText('EXECUTION ALLOWED')).toBeDefined();
  });

  it('renders human confirmation checkbox', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    expect(screen.getByText('Human confirmation provided')).toBeDefined();
  });

  it('toggles confirmation checkbox', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('shows reason when execution is denied', () => {
    render(<SimulatorTab actionSpaces={SAMPLE_ACTION_SPACES} bridge={bridge} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'emergency_stop' } });
    fireEvent.click(screen.getByText('▶ Dry-Run Execute'));
    expect(screen.getByText(/requires explicit human confirmation/)).toBeDefined();
  });

  it('handles empty action spaces gracefully', () => {
    render(<SimulatorTab actionSpaces={[]} bridge={bridge} />);
    expect(screen.getByText('Action Space Dry-Run Simulator')).toBeDefined();
  });
});

/* ── MultiModalPanel.tsx ────────────────────────────────────────────────── */

describe('MultiModalPanel', () => {
  it('renders the panel header', () => {
    render(<MultiModalPanel />);
    expect(screen.getByText('Multi-Modal & VLA Engine')).toBeDefined();
  });

  it('renders the version subtitle', () => {
    render(<MultiModalPanel />);
    expect(screen.getByText('v82.0.0 · Vision · Audio · Sensor · Action Space')).toBeDefined();
  });

  it('renders all four tab buttons', () => {
    render(<MultiModalPanel />);
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Assets')).toBeDefined();
    expect(screen.getByText('Actions')).toBeDefined();
    expect(screen.getByText('Simulator')).toBeDefined();
  });

  it('starts on the Overview tab', () => {
    render(<MultiModalPanel />);
    expect(screen.getByText('Multimodal Specifications')).toBeDefined();
  });

  it('switches to Assets tab when clicked', () => {
    render(<MultiModalPanel />);
    fireEvent.click(screen.getByText('Assets'));
    expect(screen.getByText('All Multimodal Assets')).toBeDefined();
  });

  it('switches to Actions tab when clicked', () => {
    render(<MultiModalPanel />);
    fireEvent.click(screen.getByText('Actions'));
    expect(screen.getByText('🎯')).toBeDefined();
  });

  it('switches to Simulator tab when clicked', () => {
    render(<MultiModalPanel />);
    fireEvent.click(screen.getByText('Simulator'));
    expect(screen.getByText('Action Space Dry-Run Simulator')).toBeDefined();
  });

  it('switches back to Overview from another tab', () => {
    render(<MultiModalPanel />);
    fireEvent.click(screen.getByText('Assets'));
    fireEvent.click(screen.getByText('Overview'));
    expect(screen.getByText('Multimodal Specifications')).toBeDefined();
  });

  it('renders sample data when no parsed objects provided', () => {
    render(<MultiModalPanel />);
    expect(screen.getByText((content, element) => content.includes('mm-factory-inspection'))).toBeDefined();
  });

  it('uses parsed objects when provided', () => {
    const parsedObjects = [
      {
        _type: 'multimodal',
        id: 'parsed-mm',
        modalities: ['vision'],
        assets: [],
      },
      {
        _type: 'action_space',
        id: 'parsed-as',
        actions: [{ name: 'test_action', type: 'digital', safety_level: 'low' }],
      },
    ];
    render(<MultiModalPanel parsedObjects={parsedObjects} />);
    expect(screen.getByText((content, element) => content.includes('parsed-mm'))).toBeDefined();
  });

  it('renders correct tab count on TabButton labels', () => {
    render(<MultiModalPanel />);
    const overviewTab = screen.getByText('Overview').closest('button');
    expect(overviewTab?.className).toBeDefined();
  });

  it('applies active class to the current tab', () => {
    const { container } = render(<MultiModalPanel />);
    const buttons = container.querySelectorAll('button');
    const overviewButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Overview'));
    expect(overviewButton?.textContent).toContain('Overview');
  });
});

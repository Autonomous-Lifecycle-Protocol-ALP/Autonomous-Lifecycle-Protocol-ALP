import { describe, it, expect, vi } from 'vitest';
import { MultiModalBridge, MultiModalExecutionResult, ContextBudgetResult } from '../src/multimodal';

// Mock the parser's MultiModalEngine
vi.mock('@autonomous-lifecycle-protocol-alp/parser', () => {
  const actual = vi.importActual('@autonomous-lifecycle-protocol-alp/parser');
  return {
    ...actual,
    MultiModalEngine: class {
      estimateTokenCost(modalities: string[], assets: any[], visionModel?: any): number {
        return modalities.length * 100 + assets.length * 50 + (visionModel?.context_tokens ? 10 : 0);
      }
    },
  };
});

describe('MultiModalBridge', () => {
  it('estimateContextBudget calculates tokens and budget', () => {
    const bridge = new MultiModalBridge();
    const spec = { modalities: ['vision', 'text'], assets: [{ id: 'a1', type: 'image' }] } as any;
    const result = bridge.estimateContextBudget(spec, undefined, 8192);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.maxContextTokens).toBe(8192);
    expect(result.budgetPercent).toBeGreaterThan(0);
    expect(result.remainingTokens).toBeGreaterThanOrEqual(0);
  });

  it('estimateContextBudget uses visionModel context_tokens', () => {
    const bridge = new MultiModalBridge();
    const spec = { modalities: ['vision'], assets: [] } as any;
    const visionModel = { context_tokens: 4096 };
    const result = bridge.estimateContextBudget(spec, visionModel, 8192);
    expect(result.maxContextTokens).toBe(4096);
  });

  it('estimateContextBudget caps budgetPercent at 100', () => {
    // Create a bridge with a mocked engine that returns high token count
    const bridge = new MultiModalBridge();
    const mockEngine = {
      estimateTokenCost: () => 10000,
    };
    // Use Object.defineProperty to override the private engine
    Object.defineProperty(bridge as any, 'engine', { value: mockEngine });
    const spec = { modalities: ['vision'], assets: [] } as any;
    const result = bridge.estimateContextBudget(spec, undefined, 50);
    expect(result.budgetPercent).toBe(100);
    expect(result.remainingTokens).toBe(0);
  });

  it('validateActionExecution rejects unknown action', () => {
    const bridge = new MultiModalBridge();
    const space = { id: 's1', actions: [] } as any;
    const result = bridge.validateActionExecution(space, 'unknown');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not defined');
  });

  it('validateActionExecution rejects missing required params', () => {
    const bridge = new MultiModalBridge();
    const space = {
      id: 's1',
      actions: [{ name: 'move', parameters: [{ name: 'x', required: true }], safety_level: 'low' }],
    } as any;
    const result = bridge.validateActionExecution(space, 'move', {});
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Required parameter');
  });

  it('validateActionExecution rejects critical without confirmation', () => {
    const bridge = new MultiModalBridge();
    const space = {
      id: 's1',
      actions: [{ name: 'delete', parameters: [], safety_level: 'critical', requires_confirmation: true }],
    } as any;
    const result = bridge.validateActionExecution(space, 'delete', {}, false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('CRITICAL');
  });

  it('validateActionExecution allows valid action', () => {
    const bridge = new MultiModalBridge();
    const space = {
      id: 's1',
      actions: [{ name: 'move', parameters: [], safety_level: 'low' }],
    } as any;
    const result = bridge.validateActionExecution(space, 'move', { x: 1 });
    expect(result.allowed).toBe(true);
    expect(result.safetyLevel).toBe('low');
  });

  it('fuseMultimodalStreams combines assets and prompt', () => {
    const bridge = new MultiModalBridge();
    const assets = [
      { id: 'a1', type: 'image', uri: 'file://a1.jpg', resolution: '512x512' },
      { id: 'a2', type: 'audio', uri: 'file://a2.mp3' },
    ];
    const result = bridge.fuseMultimodalStreams('Hello', assets);
    expect(result.totalAssets).toBe(2);
    expect(result.modalities).toEqual(['text', 'image', 'audio']);
    expect(result.promptPayload).toContain('Hello');
    expect(result.promptPayload).toContain('file://a1.jpg');
    expect(result.promptPayload).toContain('Res: 512x512');
  });

  it('fuseMultimodalStreams handles empty assets', () => {
    const bridge = new MultiModalBridge();
    const result = bridge.fuseMultimodalStreams('Hello', []);
    expect(result.totalAssets).toBe(0);
    expect(result.modalities).toEqual(['text']);
    expect(result.promptPayload).toBe('=== MULTIMODAL VLA CONTEXT (0 ASSETS) ===\n=== PROMPT ===\nHello');
  });
});

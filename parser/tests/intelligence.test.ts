import { describe, it, expect } from 'vitest';
import { IntelligenceEngine, SmartSuggestion, DiagnosisResult, PredictionResult, ReviewFinding } from '../src/index';

function engineFrom() {
  return new IntelligenceEngine();
}

describe('IntelligenceEngine (v44.0.0)', () => {
  describe('suggestNext', () => {
    it('returns suggestions for an empty workspace', () => {
      const engine = engineFrom();
      const suggestions = engine.suggestNext([]);
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('suggests creating a goal when none exists', () => {
      const engine = engineFrom();
      const suggestions = engine.suggestNext([
        { _type: 'task', id: 'task-1', description: 'A task' },
      ]);
      const goalSuggestions = suggestions.filter((s) => s.type === 'object' && s.label.includes('@goal'));
      expect(goalSuggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('suggests creating tasks when goal exists but no tasks', () => {
      const engine = engineFrom();
      const suggestions = engine.suggestNext([
        { _type: 'goal', id: 'goal-1', description: 'A goal' },
      ]);
      const taskSuggestions = suggestions.filter((s) => s.label.includes('@task'));
      expect(taskSuggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('suggests creating agents when tasks exist but no agents', () => {
      const engine = engineFrom();
      const suggestions = engine.suggestNext([
        { _type: 'goal', id: 'goal-1', description: 'A goal' },
        { _type: 'task', id: 'task-1', description: 'A task' },
      ]);
      const agentSuggestions = suggestions.filter((s) => s.label.includes('@agent'));
      expect(agentSuggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('suggests resolving blocked tasks', () => {
      const engine = engineFrom();
      const suggestions = engine.suggestNext([
        { _type: 'task', id: 'task-1', status: '[!]', description: 'Blocked' },
      ]);
      const blockedSuggestions = suggestions.filter((s) => s.type === 'fix');
      expect(blockedSuggestions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('diagnose', () => {
    it('diagnoses a dependency cycle error', () => {
      const engine = engineFrom();
      const result = engine.diagnose('Cycle detected in dependency graph');
      expect(result.likely_cause).toContain('cycle');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('diagnoses a missing reference error', () => {
      const engine = engineFrom();
      const result = engine.diagnose('Reference task-99 not found');
      expect(result.likely_cause).toContain('not exist');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('diagnoses a validation error', () => {
      const engine = engineFrom();
      const result = engine.diagnose('Schema validation error: invalid type for field');
      expect(result.likely_cause).toContain('validation');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('diagnoses a permission error', () => {
      const engine = engineFrom();
      const result = engine.diagnose('Permission denied for path src/main.alp');
      expect(result.likely_cause).toContain('Policy');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('returns a stable id format', () => {
      const engine = engineFrom();
      const result = engine.diagnose('some error');
      expect(result.id).toMatch(/^diag-/);
    });
  });

  describe('predictOutcome', () => {
    const objects = [
      { id: 'task-1', status: '[ ]', depends_on: [] },
      { id: 'task-2', status: '[x]', depends_on: ['task-1'] },
      { id: 'task-3', status: '[!]', depends_on: ['task-1'] },
    ];

    it('returns undefined for unknown task id', () => {
      const engine = engineFrom();
      expect(engine.predictOutcome('missing', objects)).toBeUndefined();
    });

    it('predicts ready status when all deps are done', () => {
      const engine = engineFrom();
      const result = engine.predictOutcome('task-2', [
        { id: 'task-1', status: '[x]', depends_on: [] },
        { id: 'task-2', status: '[ ]', depends_on: ['task-1'] },
      ]);
      expect(result).toBeDefined();
      expect(result!.predicted_status).toBe('ready');
      expect(result!.confidence).toBeGreaterThan(0.5);
    });

    it('predicts blocked status when deps are blocked', () => {
      const engine = engineFrom();
      const result = engine.predictOutcome('task-3', [
        { id: 'task-1', status: '[!]', depends_on: [] },
        { id: 'task-3', status: '[ ]', depends_on: ['task-1'] },
      ]);
      expect(result).toBeDefined();
      expect(result!.predicted_status).toBe('blocked');
      expect(result!.risk_factors.length).toBeGreaterThan(0);
    });
  });

  describe('review', () => {
    it('flags missing descriptions', () => {
      const engine = engineFrom();
      const findings = engine.review([
        { _type: 'task', id: 'task-1', status: '[ ]' },
      ]);
      const missingDesc = findings.filter((f) => f.kind === 'missing_field');
      expect(missingDesc.length).toBeGreaterThanOrEqual(1);
    });

    it('flags tasks without assigned agents', () => {
      const engine = engineFrom();
      const findings = engine.review([
        { _type: 'task', id: 'task-1', status: '[ ]' },
      ]);
      const noAgent = findings.filter((f) => f.message.includes('no assigned agent'));
      expect(noAgent.length).toBeGreaterThanOrEqual(1);
    });

    it('flags blocked tasks without details', () => {
      const engine = engineFrom();
      const findings = engine.review([
        { _type: 'task', id: 'task-1', status: '[!]' },
      ]);
      const blocked = findings.filter((f) => f.object_id === 'task-1' && f.kind === 'missing_field');
      expect(blocked.length).toBeGreaterThanOrEqual(1);
    });

    it('flags missing dependencies', () => {
      const engine = engineFrom();
      const findings = engine.review([
        { _type: 'task', id: 'task-1', depends_on: ['missing-dep'] },
      ]);
      const missingDep = findings.filter((f) => f.message.includes('does not exist'));
      expect(missingDep.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty findings for a clean workspace', () => {
      const engine = engineFrom();
      const findings = engine.review([
        { _type: 'task', id: 'task-1', description: 'Do work', agent: 'agent-1', status: '[ ]' },
      ]);
      expect(findings).toHaveLength(0);
    });
  });
});

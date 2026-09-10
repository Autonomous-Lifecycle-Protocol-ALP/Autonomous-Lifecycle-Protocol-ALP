import { IntelligenceEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../workspace';

export const toolDefinitions = [
  {
    name: 'alp_intelligence_suggest',
    description: 'Get AI-powered suggestions for next ALP objects to create (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
      },
    },
  },
  {
    name: 'alp_intelligence_diagnose',
    description: 'Diagnose an error with likely cause and fix suggestions (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        error: { type: 'string', description: 'Error text to diagnose' },
      },
      required: ['error'],
    },
  },
  {
    name: 'alp_intelligence_predict',
    description: 'Predict the outcome of a task based on workspace state (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        taskId: { type: 'string', description: 'Task ID to predict' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'alp_intelligence_review',
    description: 'Run automated code review on the ALP workspace (v45.0.0).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
      },
    },
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_intelligence_suggest': {
      const objects = loadWorkspace(cwd);
      const engine = new IntelligenceEngine();
      const suggestions = engine.suggestNext(objects);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(suggestions.map(s => ({
            id: s.id,
            type: s.type,
            label: s.label,
            description: s.description,
            confidence: s.confidence,
            payload: s.payload,
          })), null, 2),
        }],
      };
    }

    case 'alp_intelligence_diagnose': {
      const errorText = (args?.error as string) || 'Unknown error';
      const engine = new IntelligenceEngine();
      const result = engine.diagnose(errorText);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: result.id,
            error: result.error,
            likely_cause: result.likely_cause,
            suggestions: result.suggestions,
            severity: result.severity,
            auto_fix: result.auto_fix,
          }, null, 2),
        }],
      };
    }

    case 'alp_intelligence_predict': {
      const taskId = (args?.taskId as string) || '';
      if (!taskId) {
        return { content: [{ type: 'text', text: 'Error: taskId is required.' }], isError: true };
      }
      const objects = loadWorkspace(cwd);
      const engine = new IntelligenceEngine();
      const result = engine.predictOutcome(taskId, objects);
      if (!result) {
        return { content: [{ type: 'text', text: `Task "${taskId}" not found.` }], isError: true };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: result.id,
            object_id: result.object_id,
            predicted_status: result.predicted_status,
            confidence: result.confidence,
            risk_factors: result.risk_factors,
            estimated_completion_ms: result.estimated_completion_ms,
          }, null, 2),
        }],
      };
    }

    case 'alp_intelligence_review': {
      const objects = loadWorkspace(cwd);
      const engine = new IntelligenceEngine();
      const findings = engine.review(objects);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(findings.map(f => ({
            id: f.id,
            object_id: f.object_id,
            kind: f.kind,
            message: f.message,
            severity: f.severity,
            suggestion: f.suggestion,
          })), null, 2),
        }],
      };
    }

    default:
      return null;
  }
}

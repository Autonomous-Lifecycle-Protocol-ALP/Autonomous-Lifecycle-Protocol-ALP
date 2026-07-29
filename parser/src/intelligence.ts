/** ALP IDE Intelligence (v45.0.0 — IDE Intelligence). */

export interface SmartSuggestion {
  id: string;
  type: 'object' | 'field' | 'agent' | 'workflow' | 'fix';
  label: string;
  description: string;
  confidence: number;
  payload: Record<string, any>;
}

export interface DiagnosisResult {
  id: string;
  error: string;
  likely_cause: string;
  suggestions: string[];
  severity: 'info' | 'warn' | 'error';
  auto_fix?: Record<string, any>;
}

export interface PredictionResult {
  id: string;
  object_id: string;
  predicted_status: string;
  confidence: number;
  risk_factors: string[];
  estimated_completion_ms?: number;
}

export interface ReviewFinding {
  id: string;
  object_id: string;
  kind: 'missing_field' | 'style' | 'risk' | 'performance' | 'security';
  message: string;
  severity: 'info' | 'warn' | 'error';
  suggestion?: string;
}

export class IntelligenceEngine {
  private suggestions: SmartSuggestion[];
  private findings: ReviewFinding[];

  constructor() {
    this.suggestions = [];
    this.findings = [];
  }

  suggestNext(objects: any[]): SmartSuggestion[] {
    this.suggestions = [];
    const ids = new Set(objects.map((o) => o.id));
    const types = new Set(objects.map((o) => o._type || o.type));
    const hasGoal = types.has('goal') || types.has('project');
    const hasTask = types.has('task');
    const hasAgent = types.has('agent');
    const hasWorkflow = types.has('workflow');
    const hasPolicy = types.has('policy');
    const hasContract = types.has('contract');

    if (!hasGoal) {
      this.suggestions.push({
        id: 'suggest-1',
        type: 'object',
        label: 'Create a @goal',
        description: 'No goal found. Define a high-level goal to anchor the workspace.',
        confidence: 0.95,
        payload: { template: 'goal' },
      });
    }

    if (hasGoal && !hasTask) {
      this.suggestions.push({
        id: 'suggest-2',
        type: 'object',
        label: 'Create @task entries',
        description: 'Goal exists but no tasks are defined. Break the goal into actionable tasks.',
        confidence: 0.9,
        payload: { template: 'task' },
      });
    }

    if (hasTask && !hasAgent) {
      this.suggestions.push({
        id: 'suggest-3',
        type: 'object',
        label: 'Define @agent roles',
        description: 'Tasks exist but no agents are assigned. Define agent roles to execute work.',
        confidence: 0.85,
        payload: { template: 'agent' },
      });
    }

    if (hasTask && !hasWorkflow) {
      this.suggestions.push({
        id: 'suggest-4',
        type: 'workflow',
        label: 'Add a @workflow',
        description: 'Tasks exist but no workflow orchestrates them. Add a workflow to sequence execution.',
        confidence: 0.8,
        payload: { template: 'workflow' },
      });
    }

    if (hasAgent && !hasPolicy) {
      this.suggestions.push({
        id: 'suggest-5',
        type: 'object',
        label: 'Add @policy guardrails',
        description: 'Agents exist but no policies constrain actions. Add policies for safety and compliance.',
        confidence: 0.7,
        payload: { template: 'policy' },
      });
    }

    if (hasWorkflow && !hasContract) {
      this.suggestions.push({
        id: 'suggest-6',
        type: 'object',
        label: 'Add @contract checks',
        description: 'Workflow exists but no contracts verify outputs. Add contracts for quality gates.',
        confidence: 0.65,
        payload: { template: 'contract' },
      });
    }

    const blockedTasks = objects.filter((o) => o.status === '[!]');
    if (blockedTasks.length > 0) {
      this.suggestions.push({
        id: 'suggest-7',
        type: 'fix',
        label: 'Resolve blocked tasks',
        description: `${blockedTasks.length} task(s) are blocked. Investigate blockers before adding new work.`,
        confidence: 0.9,
        payload: { blocked_ids: blockedTasks.map((t) => t.id) },
      });
    }

    return this.suggestions;
  }

  diagnose(error: string): DiagnosisResult {
    const lowered = error.toLowerCase();
    let likely_cause = 'Unknown error';
    let suggestions: string[] = [];
    let severity: 'info' | 'warn' | 'error' = 'error';

    if (lowered.includes('cycle') || lowered.includes('circular')) {
      likely_cause = 'Dependency cycle detected in the project graph.';
      suggestions = [
        'Review @depends_on directives for circular references.',
        'Use `alp graph` to visualize the dependency graph.',
        'Remove or restructure the circular dependency.',
      ];
    } else if (lowered.includes('missing') || lowered.includes('not found')) {
      likely_cause = 'Referenced object or file does not exist.';
      suggestions = [
        'Verify the referenced ID exists in the workspace.',
        'Check for typos in @depends_on or import statements.',
        'Run `alp validate` to find missing references.',
      ];
    } else if (lowered.includes('validation') || lowered.includes('invalid')) {
      likely_cause = 'Object failed schema validation.';
      suggestions = [
        'Check required fields are present.',
        'Verify field types match the schema (string, int, bool, list).',
        'Run `alp validate` for detailed schema errors.',
      ];
    } else if (lowered.includes('permission') || lowered.includes('denied')) {
      likely_cause = 'Policy or permission check blocked the operation.';
      suggestions = [
        'Review @policy rules governing the target path or action.',
        'Check agent role permissions.',
        'Use `alp policy --path <file>` to debug.',
      ];
    } else if (lowered.includes('timeout') || lowered.includes('timed out')) {
      likely_cause = 'Operation exceeded the allowed time limit.';
      suggestions = [
        'Increase timeout in the runner configuration.',
        'Check for infinite loops in workflow definitions.',
        'Verify network connectivity for remote operations.',
      ];
    } else if (lowered.includes('parse') || lowered.includes('syntax')) {
      likely_cause = 'Syntax error in .alp file.';
      suggestions = [
        'Check indentation (use 2 spaces per level).',
        'Verify object headers use @object_name syntax.',
        'Ensure all strings are properly quoted.',
      ];
    }

    return {
      id: `diag-${Date.now()}`,
      error,
      likely_cause,
      suggestions,
      severity,
    };
  }

  predictOutcome(objectId: string, objects: any[]): PredictionResult | undefined {
    const target = objects.find((o) => o.id === objectId);
    if (!target) return undefined;

    const deps = target.depends_on || [];
    const depObjects = deps.map((d: string) => objects.find((o) => o.id === d)).filter(Boolean);
    const doneDeps = depObjects.filter((o: any) => o.status === '[x]').length;
    const blockedDeps = depObjects.filter((o: any) => o.status === '[!]').length;

    let confidence = 0.5;
    let predicted_status = 'in-progress';
    const risk_factors: string[] = [];

    if (deps.length === 0) {
      confidence = 0.8;
      predicted_status = target.status === '[ ]' ? 'todo' : target.status;
    } else if (doneDeps === deps.length) {
      confidence = 0.85;
      predicted_status = target.status === '[ ]' ? 'ready' : target.status;
    } else if (blockedDeps > 0) {
      confidence = 0.2;
      predicted_status = 'blocked';
      risk_factors.push(`${blockedDeps} blocked dependency/ies`);
    } else if (doneDeps < deps.length) {
      confidence = 0.4 + doneDeps / deps.length * 0.3;
      predicted_status = 'in-progress';
      risk_factors.push(`${deps.length - doneDeps} incomplete dependency/ies`);
    }

    if ((target.priority === 'critical' || target.priority === 'high') && blockedDeps > 0) {
      risk_factors.push('High priority with blocked dependencies');
      confidence = Math.max(0.1, confidence - 0.2);
    }

    const estimated_completion_ms = deps.length > 0 ? (deps.length - doneDeps) * 86400000 : undefined;

    return {
      id: `pred-${Date.now()}`,
      object_id: objectId,
      predicted_status,
      confidence: Math.round(confidence * 100) / 100,
      risk_factors,
      estimated_completion_ms,
    };
  }

  review(objects: any[]): ReviewFinding[] {
    this.findings = [];
    let counter = 0;

    for (const obj of objects) {
      const id = obj.id || 'unnamed';

      if (!obj.description && !obj.title) {
        this.findings.push({
          id: `review-${++counter}`,
          object_id: id,
          kind: 'missing_field',
          message: `Missing description for ${obj._type || 'object'} "${id}".`,
          severity: 'warn',
          suggestion: 'Add a description field to explain the purpose of this object.',
        });
      }

      if ((obj._type === 'task' || obj.type === 'task') && !obj.agent) {
        this.findings.push({
          id: `review-${++counter}`,
          object_id: id,
          kind: 'risk',
          message: `Task "${id}" has no assigned agent.`,
          severity: 'warn',
          suggestion: 'Assign an agent or use a default agent role.',
        });
      }

      if (obj.status === '[!]' && !obj.details) {
        this.findings.push({
          id: `review-${++counter}`,
          object_id: id,
          kind: 'missing_field',
          message: `Blocked task "${id}" lacks details explaining the blocker.`,
          severity: 'error',
          suggestion: 'Add a details or comment explaining why this task is blocked.',
        });
      }

      const deps = obj.depends_on || [];
      for (const dep of deps) {
        if (!objects.some((o) => o.id === dep)) {
          this.findings.push({
            id: `review-${++counter}`,
            object_id: id,
            kind: 'risk',
            message: `Dependency "${dep}" on "${id}" does not exist in the workspace.`,
            severity: 'error',
            suggestion: `Create the missing dependency or remove it from depends_on.`,
          });
        }
      }
    }

    return this.findings;
  }
}

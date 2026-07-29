import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject } from './index';

export interface LintRule {
  name: string;
  description: string;
  severity: 'error' | 'warning';
  check: (obj: AlpObject, file: string) => LintDiagnostic | null;
}

export interface LintDiagnostic {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  file: string;
  line?: number;
  objectId?: string;
}

export class Linter {
  private parser: AlpParser;
  private rules: LintRule[] = [];

  constructor() {
    this.parser = new AlpParser();
    this.rules = this.defaultRules();
  }

  public addRule(rule: LintRule): void {
    this.rules.push(rule);
  }

  public lintFile(filePath: string): LintDiagnostic[] {
    const diagnostics: LintDiagnostic[] = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const objects = this.parser.parse(content);
      for (const obj of objects) {
        for (const rule of this.rules) {
          const result = rule.check(obj, filePath);
          if (result) {
            diagnostics.push(result);
          }
        }
      }
    } catch {
      // skip files that fail to parse
    }
    return diagnostics;
  }

  public lintDirectory(dir: string): { file: string; diagnostics: LintDiagnostic[] }[] {
    const results: { file: string; diagnostics: LintDiagnostic[] }[] = [];
    if (!fs.existsSync(dir)) return results;

    const walk = (current: string) => {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.alp')) {
          const diagnostics = this.lintFile(fullPath);
          if (diagnostics.length > 0) {
            results.push({ file: fullPath, diagnostics });
          }
        }
      }
    };

    walk(dir);
    return results;
  }

  public getRules(): LintRule[] {
    return [...this.rules];
  }

  private defaultRules(): LintRule[] {
    return [
      {
        name: 'kebab-case-id',
        description: 'Object IDs must be kebab-case',
        severity: 'error',
        check: (obj, file) => {
          if (!obj.id || !/^[a-z0-9-]+$/.test(obj.id)) {
            return {
              rule: 'kebab-case-id',
              severity: 'error',
              message: `ID '${obj.id || '(missing)'}' is not kebab-case`,
              file,
              objectId: obj.id,
            };
          }
          return null;
        },
      },
      {
        name: 'required-description',
        description: 'Objects should have a description',
        severity: 'warning',
        check: (obj, file) => {
          if (!obj.description) {
            return {
              rule: 'required-description',
              severity: 'warning',
              message: `Missing description on ${obj._type}`,
              file,
              objectId: obj.id,
            };
          }
          return null;
        },
      },
      {
        name: 'description-length',
        description: 'Descriptions should be at least 15 characters',
        severity: 'warning',
        check: (obj, file) => {
          if (obj.description && obj.description.length < 15) {
            return {
              rule: 'description-length',
              severity: 'warning',
              message: `Description is too short (<15 chars)`,
              file,
              objectId: obj.id,
            };
          }
          return null;
        },
      },
      {
        name: 'task-verify',
        description: 'Tasks should define verify quality gates',
        severity: 'warning',
        check: (obj, file) => {
          if (obj._type === 'task') {
            const task = obj as any;
            if (!task.verify || !Array.isArray(task.verify) || task.verify.length === 0) {
              return {
                rule: 'task-verify',
                severity: 'warning',
                message: `Task has no verify quality gates defined`,
                file,
                objectId: obj.id,
              };
            }
          }
          return null;
        },
      },
      {
        name: 'status-marker-reason',
        description: 'Blocked/Awaiting status markers require reason text',
        severity: 'warning',
        check: (obj, file) => {
          const status = (obj as any).status as string | undefined;
          if (status && (status.startsWith('[!]') || status.startsWith('[?]'))) {
            const reason = status.slice(3).trim();
            if (!reason) {
              return {
                rule: 'status-marker-reason',
                severity: 'warning',
                message: `Status marker requires reason text (e.g. '[!] reason')`,
                file,
                objectId: obj.id,
              };
            }
          }
          return null;
        },
      },
      {
        name: 'no-tabs',
        description: 'Use spaces instead of tabs',
        severity: 'error',
        check: (obj, file) => {
          if (obj.description && obj.description.includes('\t')) {
            return {
              rule: 'no-tabs',
              severity: 'error',
              message: 'Description contains tab characters',
              file,
              objectId: obj.id,
            };
          }
          return null;
        },
      },
    ];
  }
}

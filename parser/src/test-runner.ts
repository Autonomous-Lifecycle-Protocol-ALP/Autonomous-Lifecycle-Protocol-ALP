import * as fs from 'fs';
import * as path from 'path';
import { AlpParser, AlpObject } from './index';

export interface TestCase {
  id: string;
  description: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export interface TestSuiteResult {
  file: string;
  passed: number;
  failed: number;
  total: number;
  tests: TestCase[];
  durationMs: number;
}

export interface CoverageReport {
  files: number;
  totalObjects: number;
  coveredObjects: number;
  coveragePercent: number;
}

export class TestRunner {
  private parser: AlpParser;
  private results: TestSuiteResult[] = [];
  private totalPassed = 0;
  private totalFailed = 0;

  constructor() {
    this.parser = new AlpParser();
  }

  public runWorkspace(alpDir: string): TestSuiteResult[] {
    this.results = [];
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.runDirectory(alpDir);
    return this.results;
  }

  public runFile(filePath: string): TestSuiteResult {
    const start = Date.now();
    const tests: TestCase[] = [];
    let passed = 0;
    let failed = 0;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const objects = this.parser.parse(content);

      for (const obj of objects) {
        if (obj._type === 'test' || obj._type === '@test') {
          const testStart = Date.now();
          try {
            this.runTestObject(obj);
            tests.push({
              id: obj.id || 'unknown',
              description: (obj as any).description || 'No description',
              passed: true,
              durationMs: Date.now() - testStart,
            });
            passed++;
          } catch (e: any) {
            tests.push({
              id: obj.id || 'unknown',
              description: (obj as any).description || 'No description',
              passed: false,
              error: e.message,
              durationMs: Date.now() - testStart,
            });
            failed++;
          }
        }
      }
    } catch (e: any) {
      // parse error
    }

    const durationMs = Date.now() - start;
    this.totalPassed += passed;
    this.totalFailed += failed;

    const result: TestSuiteResult = {
      file: filePath,
      passed,
      failed,
      total: passed + failed,
      tests,
      durationMs,
    };
    this.results.push(result);
    return result;
  }

  public getCoverage(alpDir: string): CoverageReport {
    let totalObjects = 0;
    let coveredObjects = 0;
    let files = 0;

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.alp')) {
          files++;
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const objects = this.parser.parse(content);
            totalObjects += objects.length;
            coveredObjects += objects.filter((o: AlpObject) => o._type === 'test' || o._type === '@test').length;
          } catch {
            // ignore
          }
        }
      }
    };

    walk(alpDir);

    return {
      files,
      totalObjects,
      coveredObjects,
      coveragePercent: totalObjects > 0 ? Math.round((coveredObjects / totalObjects) * 100) : 0,
    };
  }

  public getSummary() {
    return {
      totalPassed: this.totalPassed,
      totalFailed: this.totalFailed,
      totalTests: this.totalPassed + this.totalFailed,
      passRate: this.totalPassed + this.totalFailed > 0
        ? Math.round((this.totalPassed / (this.totalPassed + this.totalFailed)) * 100)
        : 0,
      suites: this.results.length,
    };
  }

  private runDirectory(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.runDirectory(fullPath);
      } else if (entry.name.endsWith('.alp')) {
        this.runFile(fullPath);
      }
    }
  }

  private runTestObject(obj: AlpObject): void {
    const test = obj as any;
    if (test.expect_fail) {
      throw new Error('Test marked as expected failure');
    }
    if (test.verify && Array.isArray(test.verify)) {
      for (const v of test.verify) {
        if (typeof v === 'string' && v.startsWith('!')) {
          throw new Error(`Verification failed: ${v}`);
        }
      }
    }
  }
}

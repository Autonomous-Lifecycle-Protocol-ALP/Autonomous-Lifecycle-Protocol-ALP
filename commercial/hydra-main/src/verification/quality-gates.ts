export interface QualityGate {
  id: string;
  name: string;
  type: "test" | "lint" | "security" | "coverage" | "performance";
  threshold: number;
  weight: number;
}

export interface VerificationResult {
  gateId: string;
  passed: boolean;
  score: number;
  details: string;
}

export class QualityGateEngine {
  private readonly gates: Map<string, QualityGate> = new Map();

  registerGate(gate: QualityGate): void {
    this.gates.set(gate.id, gate);
  }

  async verify(gateId: string, input: Record<string, unknown>): Promise<VerificationResult> {
    const gate = this.gates.get(gateId);
    if (!gate) {
      return { gateId, passed: false, score: 0, details: `Gate ${gateId} not found` };
    }
    const score = (input.score as number) ?? 0;
    const passed = score >= gate.threshold;
    return {
      gateId,
      passed,
      score,
      details: passed ? `Met threshold ${gate.threshold}` : `Below threshold ${gate.threshold}`,
    };
  }
}

export interface AutonomyDecision {
  id: string;
  type: string;
  workflowId: string;
  rationale: string;
  confidence: number;
  timestamp: string;
}

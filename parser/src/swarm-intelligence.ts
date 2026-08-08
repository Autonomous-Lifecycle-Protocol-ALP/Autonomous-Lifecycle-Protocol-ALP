/** ALP Swarm Intelligence Primitives (v86.0.0). */

export interface SwarmSignal {
  agent_id: string;
  swarm_id: string;
  type: 'task_complete' | 'task_fail' | 'handoff' | 'claim' | 'error';
  timestamp: string;
  metadata: Record<string, any>;
}

export interface EmergentPattern {
  pattern_id: string;
  pattern_type: 'bottleneck' | 'repeated_failure' | 'load_imbalance' | 'coordination_gap';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_agents: string[];
  detected_at: string;
}

export interface AgentSpecialization {
  agent_id: string;
  role: string;
  confidence: number;
  task_count: number;
  success_rate: number;
  last_updated: string;
}

export class EmergentBehaviorDetector {
  private signals: SwarmSignal[] = [];

  ingest(signal: SwarmSignal): void {
    this.signals.push(signal);
  }

  detect(): EmergentPattern[] {
    const patterns: EmergentPattern[] = [];
    const agentFailures: Record<string, number> = {};
    const agentClaims: Record<string, number> = {};
    const allAgents = new Set<string>();

    for (const s of this.signals) {
      allAgents.add(s.agent_id);
      if (s.type === 'task_fail') {
        agentFailures[s.agent_id] = (agentFailures[s.agent_id] || 0) + 1;
      }
      if (s.type === 'claim') {
        agentClaims[s.agent_id] = (agentClaims[s.agent_id] || 0) + 1;
      }
    }

    for (const [agent, count] of Object.entries(agentFailures)) {
      if (count >= 3) {
        patterns.push({
          pattern_id: `pattern-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          pattern_type: 'repeated_failure',
          severity: count >= 5 ? 'high' : 'medium',
          description: `Agent '${agent}' has failed ${count} tasks; investigate root cause.`,
          affected_agents: [agent],
          detected_at: new Date().toISOString(),
        });
      }
    }

    const claimValues = Object.values(agentClaims);
    const allClaimValues = Array.from(allAgents).map((a) => agentClaims[a] || 0);
    if (allClaimValues.length >= 2) {
      const max = Math.max(...allClaimValues);
      const min = Math.min(...allClaimValues);
      if (max > 0 && min === 0) {
        const idleAgents = Array.from(allAgents).filter((a) => (agentClaims[a] || 0) === 0);
        patterns.push({
          pattern_id: `pattern-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          pattern_type: 'load_imbalance',
          severity: 'medium',
          description: `Load imbalance detected: ${idleAgents.length} agents have no claims while max claims is ${max}.`,
          affected_agents: idleAgents,
          detected_at: new Date().toISOString(),
        });
      }
    }

    return patterns;
  }

  reset(): void {
    this.signals = [];
  }
}

export class RoleSpecializer {
  private specializations: Map<string, AgentSpecialization> = new Map();

  record(agent_id: string, role: string, success: boolean): void {
    const existing = this.specializations.get(agent_id);
    if (existing) {
      existing.task_count += 1;
      existing.success_rate = existing.success_rate * 0.8 + (success ? 1.0 : 0.0) * 0.2;
      existing.last_updated = new Date().toISOString();
      if (existing.success_rate > 0.8) {
        existing.role = role;
        existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      }
    } else {
      this.specializations.set(agent_id, {
        agent_id,
        role,
        confidence: success ? 0.7 : 0.3,
        task_count: 1,
        success_rate: success ? 1.0 : 0.0,
        last_updated: new Date().toISOString(),
      });
    }
  }

  getSpecialization(agent_id: string): AgentSpecialization | undefined {
    return this.specializations.get(agent_id);
  }

  getAll(): AgentSpecialization[] {
    return Array.from(this.specializations.values()).sort((a, b) => b.confidence - a.confidence);
  }
}

export interface CollectiveVote {
  vote_id: string;
  proposal_id: string;
  voter_id: string;
  approved: boolean;
  rationale?: string;
  timestamp: string;
}

export interface CollectiveDecision {
  decision_id: string;
  proposal_id: string;
  quorum: number;
  votes: CollectiveVote[];
  decided_at: string;
  passed: boolean;
}

export class CollectiveDecisionMaker {
  private votes: CollectiveVote[] = [];

  castVote(proposal_id: string, voter_id: string, approved: boolean, rationale?: string): CollectiveVote {
    const vote: CollectiveVote = {
      vote_id: `vote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      proposal_id,
      voter_id,
      approved,
      rationale,
      timestamp: new Date().toISOString(),
    };
    this.votes.push(vote);
    return vote;
  }

  decide(proposal_id: string, quorum: number): CollectiveDecision {
    const proposalVotes = this.votes.filter((v) => v.proposal_id === proposal_id);
    const approved = proposalVotes.filter((v) => v.approved).length;
    const passed = approved >= quorum;
    return {
      decision_id: `decision-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      proposal_id,
      quorum,
      votes: proposalVotes,
      decided_at: new Date().toISOString(),
      passed,
    };
  }
}

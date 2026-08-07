use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRecord {
    pub agent_id: String,
    pub role: String,
    pub load: f64,
    pub capacity: f64,
    pub success_rate: f64,
    pub specializations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwarmDecision {
    pub decision_id: String,
    pub proposal: String,
    pub score: f64,
    pub votes: usize,
    pub quorum_met: bool,
    pub participants: Vec<String>,
}

pub struct EmergentBehaviorDetector {
    threshold: f64,
}

impl EmergentBehaviorDetector {
    pub fn new(threshold: f64) -> Self {
        Self {
            threshold: if threshold > 0.0 { threshold } else { 0.8 },
        }
    }

    pub fn detect(&self, agents: &[AgentRecord]) -> Vec<String> {
        let mut signs = Vec::new();
        if agents.len() > 1 {
            let loads: Vec<f64> = agents
                .iter()
                .map(|a| a.load / a.capacity.max(0.001))
                .collect();
            let avg = loads.iter().sum::<f64>() / loads.len() as f64;
            let variance =
                loads.iter().map(|&x| (x - avg).powi(2)).sum::<f64>() / loads.len() as f64;
            let std = variance.sqrt();
            if std > 0.25 {
                signs.push(format!("load_variance={:.4}", std));
            }
        }
        let mut role_counts: HashMap<String, usize> = HashMap::new();
        for a in agents {
            *role_counts.entry(a.role.clone()).or_insert(0) += 1;
        }
        if !role_counts.is_empty() {
            let mut min_count = agents.len();
            let mut max_count = 0;
            for &c in role_counts.values() {
                min_count = min_count.min(c);
                max_count = max_count.max(c);
            }
            let imbalance = if max_count > 0 {
                (max_count - min_count) as f64 / max_count as f64
            } else {
                0.0
            };
            if imbalance > 0.4 {
                signs.push(format!("role_imbalance={:.4}", imbalance));
            }
        }
        signs
    }
}

pub struct RoleSpecializer;

impl RoleSpecializer {
    pub fn new() -> Self {
        Self
    }

    pub fn assign_roles(&self, agents: &[AgentRecord]) -> HashMap<String, String> {
        let mut assignments = HashMap::new();
        for agent in agents {
            let mut best_role = &agent.role;
            let mut best_score = 0.0;
            for spec in &agent.specializations {
                let score = agent.success_rate * (1.0 - agent.load / agent.capacity.max(0.001));
                if score > best_score {
                    best_score = score;
                    best_role = spec;
                }
            }
            assignments.insert(agent.agent_id.clone(), best_role.clone());
        }
        assignments
    }
}

pub struct CollectiveDecisionMaker {
    quorum: usize,
}

impl CollectiveDecisionMaker {
    pub fn new(quorum: usize) -> Self {
        Self {
            quorum: if quorum > 0 { quorum } else { 3 },
        }
    }

    pub fn decide(&self, proposals: &[String], voters: &[AgentRecord]) -> Option<SwarmDecision> {
        if proposals.is_empty() || voters.is_empty() {
            return None;
        }
        let mut votes: HashMap<String, usize> = HashMap::new();
        let mut participants = Vec::new();
        for voter in voters {
            if voter.load < 0.9 {
                let idx = (voter.success_rate * proposals.len() as f64) as usize % proposals.len();
                let choice = &proposals[idx];
                *votes.entry(choice.clone()).or_insert(0) += 1;
                participants.push(voter.agent_id.clone());
            }
        }
        let mut ranked: Vec<_> = votes
            .into_iter()
            .map(|(proposal, count)| (proposal, count))
            .collect();
        ranked.sort_by(|a, b| b.1.cmp(&a.1));
        if let Some((proposal, vote_count)) = ranked.first() {
            Some(SwarmDecision {
                decision_id: format!("decision-{}", participants.len()),
                proposal: proposal.clone(),
                score: *vote_count as f64 / participants.len() as f64,
                votes: *vote_count,
                quorum_met: *vote_count >= self.quorum,
                participants,
            })
        } else {
            None
        }
    }
}

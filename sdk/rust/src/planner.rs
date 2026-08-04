use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanNode {
    pub id: String,
    pub kind: String,
    pub label: String,
    pub depends_on: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub plan_id: String,
    pub goal: String,
    pub nodes: Vec<PlanNode>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImprovementProposal {
    pub proposal_id: String,
    pub lesson_id: String,
    pub target_node_id: Option<String>,
    pub action: String,
    pub detail: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lesson {
    pub lesson_id: String,
    pub run_id: String,
    pub insight: String,
    pub severity: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RankedPlan {
    pub plan: Plan,
    pub score: PlanScore,
    pub rank: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanScore {
    pub node_count: usize,
    pub depth: usize,
    pub risk: f64,
    pub confidence: String,
    pub complexity: f64,
    pub composite: f64,
}

pub struct GoalDecomposer;

impl GoalDecomposer {
    pub fn decompose(&self, goal: &str, constraints: Option<HashMap<String, serde_json::Value>>) -> Option<Plan> {
        let goal = goal.trim();
        if goal.is_empty() {
            return None;
        }
        let plan_id = sanitize_goal(goal);
        let steps = extract_verbs(goal);
        let mut nodes = Vec::new();
        for (i, step) in steps.iter().enumerate() {
            let deps = if i > 0 { vec![format!("step-{}", i)] } else { Vec::new() };
            nodes.push(PlanNode {
                id: format!("step-{}", i + 1),
                kind: "task".to_string(),
                label: step.clone(),
                depends_on: deps,
            });
        }
        let mut metadata = HashMap::new();
        metadata.insert("constraints".to_string(), serde_json::json!(constraints.unwrap_or_default()));
        Some(Plan {
            plan_id,
            goal: goal.to_string(),
            nodes,
            metadata,
        })
    }

    pub fn to_workflow(&self, plan: &Plan) -> Plan {
        plan.clone()
    }
}

pub struct Planner;

impl Planner {
    pub fn rank(&self, plans: &[Plan]) -> Vec<RankedPlan> {
        let mut scored: Vec<RankedPlan> = plans
            .iter()
            .map(|plan| RankedPlan {
                plan: plan.clone(),
                score: self.score(plan),
                rank: 0,
            })
            .collect();
        scored.sort_by(|a, b| b.score.composite.partial_cmp(&a.score.composite).unwrap());
        for (i, entry) in scored.iter_mut().enumerate() {
            entry.rank = i + 1;
        }
        scored
    }

    pub fn score(&self, plan: &Plan) -> PlanScore {
        let node_count = plan.nodes.len();
        let depth = max_depth(plan);
        let risk = 0.5;
        let confidence = "low";
        let complexity = node_count as f64 * 0.1 + depth as f64 * 0.2;
        let composite = (1.0 - risk - complexity * 0.1).max(0.0);
        PlanScore {
            node_count,
            depth,
            risk,
            confidence: confidence.to_string(),
            complexity: (complexity * 10000.0).round() / 10000.0,
            composite: (composite * 10000.0).round() / 10000.0,
        }
    }
}

pub struct Reflector {
    pub events: Vec<HashMap<String, serde_json::Value>>,
}

impl Reflector {
    pub fn new(events: Option<Vec<HashMap<String, serde_json::Value>>>) -> Self {
        Self { events: events.unwrap_or_default() }
    }

    pub fn reflect(&self, run_id: &str) -> Vec<Lesson> {
        let mut lessons = Vec::new();
        lessons.extend(self.detect_failure_patterns(run_id));
        lessons.extend(self.detect_inefficiencies(run_id));
        lessons.extend(self.detect_handoff_patterns(run_id));
        lessons
    }

    fn detect_failure_patterns(&self, run_id: &str) -> Vec<Lesson> {
        let mut lessons = Vec::new();
        let mut task_failures: HashMap<String, usize> = HashMap::new();
        for e in &self.events {
            if e.get("type").and_then(|v| v.as_str()) == Some("task_status") && e.get("status").and_then(|v| v.as_str()) == Some("[!]") {
                if let Some(tid) = e.get("task_id").and_then(|v| v.as_str()) {
                    *task_failures.entry(tid.to_string()).or_insert(0) += 1;
                }
            }
        }
        for (tid, count) in task_failures {
            if count >= 2 {
                lessons.push(Lesson {
                    lesson_id: format!("lesson-{}", lessons.len() + 1),
                    run_id: run_id.to_string(),
                    insight: format!("Task '{}' failed {} times; consider retry or fallback strategy.", tid, count),
                    severity: "warn".to_string(),
                    tags: vec!["failure".to_string(), tid],
                });
            }
        }
        lessons
    }

    fn detect_inefficiencies(&self, run_id: &str) -> Vec<Lesson> {
        let mut lessons = Vec::new();
        let mut claim_counts: HashMap<String, usize> = HashMap::new();
        for e in &self.events {
            if e.get("type").and_then(|v| v.as_str()) == Some("task_claim") {
                if let Some(tid) = e.get("task_id").and_then(|v| v.as_str()) {
                    *claim_counts.entry(tid.to_string()).or_insert(0) += 1;
                }
            }
        }
        for (tid, count) in claim_counts {
            if count >= 3 {
                lessons.push(Lesson {
                    lesson_id: format!("lesson-{}", lessons.len() + 1),
                    run_id: run_id.to_string(),
                    insight: format!("Task '{}' was claimed {} times; review ownership logic.", tid, count),
                    severity: "info".to_string(),
                    tags: vec!["efficiency".to_string(), tid],
                });
            }
        }
        lessons
    }

    fn detect_handoff_patterns(&self, run_id: &str) -> Vec<Lesson> {
        let mut handoffs = 0;
        for e in &self.events {
            if e.get("type").and_then(|v| v.as_str()) == Some("human_handoff") || e.get("status").and_then(|v| v.as_str()) == Some("[?]") {
                handoffs += 1;
            }
        }
        if handoffs > 1 {
            return vec![Lesson {
                lesson_id: "lesson-1".to_string(),
                run_id: run_id.to_string(),
                insight: format!("Run had {} human handoffs; consider automating or simplifying decision gates.", handoffs),
                severity: "warn".to_string(),
                tags: vec!["handoff".to_string()],
            }];
        }
        Vec::new()
    }

    pub fn improve_plan(&self, plan: &Plan, lessons: &[Lesson], constraints: Option<&HashMap<String, serde_json::Value>>) -> HashMap<String, serde_json::Value> {
        let mut nodes = plan.nodes.clone();
        let mut seen = std::collections::HashSet::new();
        let mut proposals = Vec::new();
        for lesson in lessons {
            if lesson.tags.contains(&"failure".to_string()) && lesson.tags.contains(&"failed".to_string()) {
                let target = extract_task_id(&lesson.insight);
                proposals.push(ImprovementProposal {
                    proposal_id: format!("prop-{}", proposals.len() + 1),
                    lesson_id: lesson.lesson_id.clone(),
                    target_node_id: Some(target),
                    action: "add_dependency".to_string(),
                    detail: format!("Add fallback or retry dependency for '{}' due to repeated failures.", target),
                    confidence: 0.75,
                });
            }
            if lesson.tags.contains(&"efficiency".to_string()) && lesson.tags.contains(&"claimed".to_string()) {
                let target = extract_task_id(&lesson.insight);
                proposals.push(ImprovementProposal {
                    proposal_id: format!("prop-{}", proposals.len() + 1),
                    lesson_id: lesson.lesson_id.clone(),
                    target_node_id: Some(target),
                    action: "reassign".to_string(),
                    detail: format!("Reassign '{}' to a more stable owner.", target),
                    confidence: 0.6,
                });
            }
            if lesson.tags.contains(&"handoff".to_string()) {
                proposals.push(ImprovementProposal {
                    proposal_id: format!("prop-{}", proposals.len() + 1),
                    lesson_id: lesson.lesson_id.clone(),
                    target_node_id: None,
                    action: "add_node".to_string(),
                    detail: "Add automation gate to reduce human handoff frequency.".to_string(),
                    confidence: 0.5,
                });
            }
        }
        let max_nodes = constraints.and_then(|c| c.get("max_nodes")).and_then(|v| v.as_u64()).map(|v| v as usize);
        for p in &proposals {
            if p.action == "add_node" && !seen.contains(&p.proposal_id) {
                if let Some(max) = max_nodes {
                    if nodes.len() >= max {
                        continue;
                    }
                }
                nodes.push(PlanNode {
                    id: format!("node-{}", p.proposal_id),
                    kind: "task".to_string(),
                    label: p.detail.clone(),
                    depends_on: Vec::new(),
                });
                seen.insert(p.proposal_id.clone());
            }
        }
        let mut improved = Plan {
            plan_id: plan.plan_id.clone(),
            goal: plan.goal.clone(),
            nodes,
            metadata: plan.metadata.clone(),
        };
        improved.metadata.insert("improvements".to_string(), serde_json::json!(proposals.iter().map(|p| p.action.clone()).collect::<Vec<_>>()));
        let mut result = HashMap::new();
        result.insert("plan".to_string(), serde_json::json!(improved));
        result.insert("proposals".to_string(), serde_json::json!(proposals));
        result
    }
}

pub struct CollabPlanner {
    pub estimator: Option<serde_json::Value>,
}

impl CollabPlanner {
    pub fn new(estimator: Option<serde_json::Value>) -> Self {
        Self { estimator }
    }

    pub fn build(&self, goal: &str, constraints: Option<HashMap<String, serde_json::Value>>) -> Option<Plan> {
        let constraints = constraints.unwrap_or_default();
        let decomposer = GoalDecomposer;
        let mut plan = decomposer.decompose(goal, Some(constraints.clone()))?;
        let planner = Planner;
        let ranked = planner.rank(&[plan.clone()]);
        if let Some(top) = ranked.first() {
            plan = top.plan.clone();
        }
        if self.estimator.is_some() {
            plan.metadata.insert("negotiation".to_string(), serde_json::json!("accepted"));
        }
        Some(plan)
    }
}

fn max_depth(plan: &Plan) -> usize {
    if plan.nodes.is_empty() {
        return 0;
    }
    let mut depths: HashMap<String, usize> = HashMap::new();
    for n in &plan.nodes {
        depths.insert(n.id.clone(), 1);
    }
    for n in &plan.nodes {
        for dep in &n.depends_on {
            if let Some(&d) = depths.get(dep) {
                depths.insert(n.id.clone(), depths[&n.id].max(d + 1));
            }
        }
    }
    *depths.values().max().unwrap_or(&0)
}

fn extract_task_id(insight: &str) -> String {
    let parts: Vec<&str> = insight.split('\'').collect();
    if parts.len() >= 2 {
        parts[1].to_string()
    } else {
        "unknown".to_string()
    }
}

fn sanitize_goal(goal: &str) -> String {
    let mut s = goal.trim().to_lowercase();
    s = s.replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-', "-");
    if s.len() > 40 {
        s.truncate(40);
    }
    if s.is_empty() {
        "plan".to_string()
    } else {
        s
    }
}

fn extract_verbs(goal: &str) -> Vec<String> {
    let words: Vec<&str> = goal.split_whitespace().collect();
    let mut verbs = Vec::new();
    for w in words {
        let clean = w.trim_matches(|c: char| ",.!?:;".contains(c));
        if !clean.is_empty() && clean.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
            verbs.push(clean.to_string());
        }
    }
    if verbs.is_empty() {
        vec![goal.to_string()]
    } else {
        verbs
    }
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyScore {
    pub score: f64,
    pub factors: Vec<String>,
    pub baseline: HashMap<String, serde_json::Value>,
    pub recommendation: String,
}

impl AnomalyScore {
    pub fn is_anomalous(&self, threshold: f64) -> bool {
        self.score >= threshold
    }

    pub fn to_map(&self) -> HashMap<String, serde_json::Value> {
        let mut map = HashMap::new();
        map.insert("score".to_string(), serde_json::Value::from(self.score));
        map.insert(
            "factors".to_string(),
            serde_json::Value::from(self.factors.clone()),
        );
        map.insert("baseline".to_string(), serde_json::json!(self.baseline));
        map.insert(
            "recommendation".to_string(),
            serde_json::Value::from(self.recommendation.clone()),
        );
        map
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaselineProfile {
    pub kind: String,
    pub value: String,
    pub sample_count: usize,
    pub mean_frequency: f64,
    pub stddev_frequency: f64,
    pub failure_rate: f64,
    pub last_seen: String,
}

impl BaselineProfile {
    pub fn to_map(&self) -> HashMap<String, serde_json::Value> {
        let mut map = HashMap::new();
        map.insert(
            "kind".to_string(),
            serde_json::Value::from(self.kind.clone()),
        );
        map.insert(
            "value".to_string(),
            serde_json::Value::from(self.value.clone()),
        );
        map.insert(
            "sample_count".to_string(),
            serde_json::Value::from(self.sample_count),
        );
        map.insert(
            "mean_frequency".to_string(),
            serde_json::Value::from(self.mean_frequency),
        );
        map.insert(
            "stddev_frequency".to_string(),
            serde_json::Value::from(self.stddev_frequency),
        );
        map.insert(
            "failure_rate".to_string(),
            serde_json::Value::from(self.failure_rate),
        );
        map.insert(
            "last_seen".to_string(),
            serde_json::Value::from(self.last_seen.clone()),
        );
        map
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEntry {
    pub payload_kind: String,
    pub payload_value: String,
    pub status: String,
    pub blocked: bool,
    pub timestamp: String,
}

pub struct PredictivePolicyEngine {
    engine: crate::policy::PolicyEngine,
    z_threshold: f64,
    min_samples: usize,
    baselines: HashMap<String, BaselineProfile>,
    history: Vec<HistoryEntry>,
}

#[derive(Debug, Clone)]
pub(crate) struct HistoryEntry {
    query: crate::policy::PolicyQuery,
    decision: crate::policy::PolicyDecision,
}

impl PredictivePolicyEngine {
    pub fn new(objects: &[crate::AlpObject]) -> Self {
        Self {
            engine: crate::policy::PolicyEngine::new(objects),
            z_threshold: 2.5,
            min_samples: 5,
            baselines: HashMap::new(),
            history: Vec::new(),
        }
    }

    pub fn evaluate(
        &mut self,
        query: &crate::policy::PolicyQuery,
    ) -> crate::policy::PolicyDecision {
        let anomaly = self.score_query(query);
        let mut decision = self.engine.evaluate(query);
        decision
            .audit
            .insert("anomaly".to_string(), serde_json::json!(anomaly.to_map()));
        self.history.push(HistoryEntry {
            query: query.clone(),
            decision: decision.clone(),
        });
        decision
    }

    pub fn evaluate_deny_only(
        &mut self,
        query: &crate::policy::PolicyQuery,
    ) -> crate::policy::PolicyDecision {
        let anomaly = self.score_query(query);
        let mut decision = self.engine.evaluate(query);
        decision
            .audit
            .insert("anomaly".to_string(), serde_json::json!(anomaly.to_map()));
        self.history.push(HistoryEntry {
            query: query.clone(),
            decision: decision.clone(),
        });
        decision
    }

    pub fn evaluate_proposal(&mut self, proposal_id: &str) -> crate::policy::PolicyDecision {
        let anomaly = AnomalyScore {
            score: 0.0,
            factors: Vec::new(),
            baseline: HashMap::new(),
            recommendation: "monitor".to_string(),
        };
        let mut decision = crate::policy::PolicyDecision {
            allowed: false,
            blocked: false,
            reasons: Vec::new(),
            policies: Vec::new(),
            requires_approval: false,
            audit: HashMap::new(),
        };
        decision
            .audit
            .insert("anomaly".to_string(), serde_json::json!(anomaly.to_map()));
        self.history.push(HistoryEntry {
            query: crate::policy::PolicyQuery::new("proposal", proposal_id),
            decision: decision.clone(),
        });
        decision
    }

    pub fn get_baselines(&self) -> Vec<BaselineProfile> {
        let mut result: Vec<BaselineProfile> = self.baselines.values().cloned().collect();
        result.sort_by(|a, b| {
            let ord = a.kind.cmp(&b.kind);
            if ord == std::cmp::Ordering::Equal {
                a.value.cmp(&b.value)
            } else {
                ord
            }
        });
        result
    }

    pub fn get_baseline(&self, kind: &str, value: &str) -> Option<&BaselineProfile> {
        self.baselines.get(&format!("{}:{}", kind, value))
    }

    pub fn get_history(&self) -> &Vec<HistoryEntry> {
        &self.history
    }

    pub fn anomalies_summary(&self, policy_id: Option<&str>) -> HashMap<String, serde_json::Value> {
        let mut items = Vec::new();
        let mut anomalous = 0;
        for entry in &self.history {
            let anomaly = entry.decision.audit.get("anomaly");
            if anomaly.is_none() {
                continue;
            }
            if let Some(pid) = policy_id {
                let found = entry.decision.policies.iter().any(|p| p == pid);
                if !found {
                    continue;
                }
            }
            let score = anomaly
                .and_then(|v| v.get("score"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);
            if score >= self.z_threshold {
                anomalous += 1;
            }
            let factors = anomaly
                .and_then(|v| v.get("factors"))
                .cloned()
                .unwrap_or(serde_json::Value::Array(Vec::new()));
            let recommendation = anomaly
                .and_then(|v| v.get("recommendation"))
                .cloned()
                .unwrap_or(serde_json::Value::Null);
            items.push(serde_json::json!({
                "kind": entry.query.kind,
                "value": entry.query.value,
                "score": score,
                "factors": factors,
                "recommendation": recommendation,
            }));
        }
        let mut summary = HashMap::new();
        summary.insert("total".to_string(), serde_json::Value::from(items.len()));
        summary.insert("anomalous".to_string(), serde_json::Value::from(anomalous));
        summary.insert("items".to_string(), serde_json::Value::from(items));
        summary
    }

    pub fn learn_from_events(&mut self, events: &[EventEntry]) {
        let mut counts: HashMap<String, usize> = HashMap::new();
        let mut failures: HashMap<String, usize> = HashMap::new();
        let mut last_seen: HashMap<String, String> = HashMap::new();
        let mut samples: HashMap<String, Vec<f64>> = HashMap::new();

        for event in events {
            let key = format!("{}:{}", event.payload_kind, event.payload_value);
            counts
                .entry(key.clone())
                .and_modify(|e| *e += 1)
                .or_insert(1);
            samples
                .entry(key.clone())
                .or_default()
                .push(counts[&key] as f64);
            if event.status == "[!]" || event.blocked {
                failures
                    .entry(key.clone())
                    .and_modify(|e| *e += 1)
                    .or_insert(1);
            }
            last_seen.insert(key.clone(), event.timestamp.clone());
        }

        for (key, count) in counts {
            let parts: Vec<&str> = key.splitn(2, ':').collect();
            let kind = parts.get(0).map(|s| s.to_string()).unwrap_or_default();
            let value = parts.get(1).map(|s| s.to_string()).unwrap_or_default();
            let freqs = samples.get(&key).cloned().unwrap_or_default();
            let mean_freq = avg(&freqs);
            let stddev_freq = calc_stddev(&freqs);
            let failure_rate = if count > 0 {
                *failures.get(&key).unwrap_or(&0) as f64 / count as f64
            } else {
                0.0
            };
            self.baselines.insert(
                key.clone(),
                BaselineProfile {
                    kind,
                    value,
                    sample_count: count,
                    mean_frequency: mean_freq,
                    stddev_frequency: stddev_freq,
                    failure_rate,
                    last_seen: last_seen.get(&key).cloned().unwrap_or_default(),
                },
            );
        }
    }

    fn score_query(&self, query: &crate::policy::PolicyQuery) -> AnomalyScore {
        let key = format!("{}:{:?}", query.kind, query.value);
        let profile = self.baselines.get(&key);

        let mut factors = Vec::new();
        let mut score_components: Vec<f64> = Vec::new();

        if profile.is_none() || profile.map(|p| p.sample_count).unwrap_or(0) < self.min_samples {
            factors.push("insufficient_history".to_string());
            score_components.push(0.3);
        } else {
            let p = profile.unwrap();
            if p.failure_rate > 0.3 {
                factors.push("high_failure_rate".to_string());
                score_components.push(p.failure_rate.min(1.0));
            }
            if p.stddev_frequency > 2.0 {
                factors.push("high_frequency_variance".to_string());
                score_components.push(0.5);
            }
        }

        let recent = self
            .history
            .iter()
            .filter(|e| e.query.kind == query.kind && e.query.value == query.value)
            .count();
        if recent == 0 {
            factors.push("rare_request".to_string());
            score_components.push(0.4);
        } else if recent > 10 {
            factors.push("burst".to_string());
            score_components.push(0.3);
        }

        let score = if score_components.is_empty() {
            0.0
        } else {
            score_components.iter().sum::<f64>() / score_components.len() as f64
        };
        let score = score.min(1.0);
        let score = (score * 1000.0).round() / 1000.0;

        let recommendation = if score >= 0.8 {
            "escalate"
        } else if score >= 0.5 {
            "require_approval"
        } else {
            "monitor"
        };

        AnomalyScore {
            score,
            factors,
            baseline: profile.map(|p| p.to_map()).unwrap_or_default(),
            recommendation: recommendation.to_string(),
        }
    }
}

fn avg(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.iter().sum::<f64>() / values.len() as f64
}

fn calc_stddev(values: &[f64]) -> f64 {
    if values.len() < 2 {
        return 0.0;
    }
    let m = avg(values);
    let variance = values.iter().map(|v| (v - m).powi(2)).sum::<f64>() / (values.len() - 1) as f64;
    variance.sqrt()
}

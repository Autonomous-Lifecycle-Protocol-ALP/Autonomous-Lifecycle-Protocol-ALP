use std::collections::HashMap;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone)]
pub struct Vote {
    pub voter_did: String,
    pub ballot_id: String,
    pub value: String,
    pub rationale: String,
    pub timestamp: String,
    pub signature: String,
}

impl Vote {
    pub fn new(
        voter_did: impl Into<String>,
        ballot_id: impl Into<String>,
        value: impl Into<String>,
        rationale: impl Into<String>,
        timestamp: impl Into<String>,
        signature: impl Into<String>,
    ) -> Self {
        Self {
            voter_did: voter_did.into(),
            ballot_id: ballot_id.into(),
            value: value.into(),
            rationale: rationale.into(),
            timestamp: timestamp.into(),
            signature: signature.into(),
        }
    }

    pub fn to_dict(&self) -> HashMap<String, serde_json::Value> {
        let mut dict = HashMap::new();
        dict.insert(
            "voter_did".into(),
            serde_json::Value::String(self.voter_did.clone()),
        );
        dict.insert(
            "ballot_id".into(),
            serde_json::Value::String(self.ballot_id.clone()),
        );
        dict.insert(
            "value".into(),
            serde_json::Value::String(self.value.clone()),
        );
        dict.insert(
            "rationale".into(),
            serde_json::Value::String(self.rationale.clone()),
        );
        dict.insert(
            "timestamp".into(),
            serde_json::Value::String(self.timestamp.clone()),
        );
        dict.insert(
            "signature".into(),
            serde_json::Value::String(self.signature.clone()),
        );
        dict
    }

    pub fn sign(&mut self, private_key: &str) -> String {
        let mut payload = HashMap::new();
        payload.insert(
            "ballot_id",
            serde_json::Value::String(self.ballot_id.clone()),
        );
        payload.insert(
            "rationale",
            serde_json::Value::String(self.rationale.clone()),
        );
        payload.insert(
            "timestamp",
            serde_json::Value::String(self.timestamp.clone()),
        );
        payload.insert("value", serde_json::Value::String(self.value.clone()));
        payload.insert(
            "voter_did",
            serde_json::Value::String(self.voter_did.clone()),
        );
        let payload_str = serde_json::to_string(&payload).unwrap_or_default();
        self.signature = simple_hash(&(payload_str + private_key));
        self.signature.clone()
    }
}

#[derive(Debug, Clone)]
pub struct BallotRecord {
    pub ballot_id: String,
    pub policy_id: String,
    pub description: String,
    pub votes: Vec<Vote>,
    pub status: String,
    pub quorum: usize,
    pub created_at: String,
    pub closed_at: String,
}

impl BallotRecord {
    pub fn new(
        ballot_id: impl Into<String>,
        policy_id: impl Into<String>,
        description: impl Into<String>,
        votes: Vec<Vote>,
        status: impl Into<String>,
        quorum: usize,
        created_at: impl Into<String>,
        closed_at: impl Into<String>,
    ) -> Self {
        Self {
            ballot_id: ballot_id.into(),
            policy_id: policy_id.into(),
            description: description.into(),
            votes,
            status: status.into(),
            quorum,
            created_at: created_at.into(),
            closed_at: closed_at.into(),
        }
    }

    pub fn to_dict(&self) -> HashMap<String, serde_json::Value> {
        let mut dict = HashMap::new();
        dict.insert(
            "ballot_id".into(),
            serde_json::Value::String(self.ballot_id.clone()),
        );
        dict.insert(
            "policy_id".into(),
            serde_json::Value::String(self.policy_id.clone()),
        );
        dict.insert(
            "description".into(),
            serde_json::Value::String(self.description.clone()),
        );
        dict.insert(
            "votes".into(),
            serde_json::Value::Array(
                self.votes
                    .iter()
                    .map(|v| {
                        serde_json::Value::Object(
                            v.to_dict().into_iter().map(|(k, v)| (k, v)).collect(),
                        )
                    })
                    .collect(),
            ),
        );
        dict.insert(
            "status".into(),
            serde_json::Value::String(self.status.clone()),
        );
        dict.insert(
            "quorum".into(),
            serde_json::Value::Number(self.quorum.into()),
        );
        dict.insert(
            "created_at".into(),
            serde_json::Value::String(self.created_at.clone()),
        );
        dict.insert(
            "closed_at".into(),
            serde_json::Value::String(self.closed_at.clone()),
        );
        dict
    }

    pub fn tally(&self) -> HashMap<String, usize> {
        let mut counts = HashMap::new();
        counts.insert("approve".into(), 0);
        counts.insert("reject".into(), 0);
        counts.insert("abstain".into(), 0);
        for vote in &self.votes {
            let val = &vote.value;
            *counts.entry(val.clone()).or_insert(0) += 1;
        }
        counts.insert("total".into(), self.votes.len());
        counts
    }
}

pub struct GovernanceReport {
    pub ballot_id: String,
    pub result: String,
    pub tally: HashMap<String, usize>,
    pub started_at: String,
    pub finished_at: String,
}

impl GovernanceReport {
    pub fn new(
        ballot_id: impl Into<String>,
        result: impl Into<String>,
        tally: HashMap<String, usize>,
        started_at: impl Into<String>,
        finished_at: impl Into<String>,
    ) -> Self {
        Self {
            ballot_id: ballot_id.into(),
            result: result.into(),
            tally,
            started_at: started_at.into(),
            finished_at: finished_at.into(),
        }
    }

    pub fn to_dict(&self) -> HashMap<String, serde_json::Value> {
        let mut dict = HashMap::new();
        dict.insert(
            "ballot_id".into(),
            serde_json::Value::String(self.ballot_id.clone()),
        );
        dict.insert(
            "result".into(),
            serde_json::Value::String(self.result.clone()),
        );
        dict.insert(
            "tally".into(),
            serde_json::Value::Object(
                self.tally
                    .iter()
                    .map(|(k, v)| (k.clone(), serde_json::Value::Number((*v).into())))
                    .collect(),
            ),
        );
        dict.insert(
            "started_at".into(),
            serde_json::Value::String(self.started_at.clone()),
        );
        dict.insert(
            "finished_at".into(),
            serde_json::Value::String(self.finished_at.clone()),
        );
        dict
    }
}

pub struct PolicyBallot {
    alp_dir: String,
    ballots: HashMap<String, BallotRecord>,
}

impl PolicyBallot {
    pub fn new(alp_dir: impl Into<String>) -> Self {
        let alp_dir = alp_dir.into();
        let mut ballot = Self {
            alp_dir: alp_dir.clone(),
            ballots: HashMap::new(),
        };
        ballot.load();
        ballot
    }

    fn ballots_path(&self) -> String {
        Path::new(&self.alp_dir)
            .join(".governance")
            .join("ballots.jsonl")
            .to_string_lossy()
            .into_owned()
    }

    pub fn load(&mut self) {
        let path = self.ballots_path();
        if !std::path::Path::new(&path).exists() {
            return;
        }
        if let Ok(content) = std::fs::read_to_string(&path) {
            for line in content.lines() {
                if line.trim().is_empty() {
                    continue;
                }
                if let Ok(entry) = serde_json::from_str::<HashMap<String, serde_json::Value>>(line)
                {
                    let ballot_id = entry
                        .get("ballot_id")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let policy_id = entry
                        .get("policy_id")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let description = entry
                        .get("description")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let status = entry
                        .get("status")
                        .and_then(|v| v.as_str())
                        .unwrap_or("open");
                    let quorum = entry.get("quorum").and_then(|v| v.as_u64()).unwrap_or(3) as usize;
                    let created_at = entry
                        .get("created_at")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let closed_at = entry
                        .get("closed_at")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let votes = Vec::new();
                    let ballot = BallotRecord::new(
                        ballot_id,
                        policy_id,
                        description,
                        votes,
                        status,
                        quorum,
                        created_at,
                        closed_at,
                    );
                    self.ballots.insert(ballot_id.into(), ballot);
                }
            }
        }
    }

    fn save_ballot(&self, ballot: &BallotRecord) {
        let dir = Path::new(&self.alp_dir).join(".governance");
        let _ = std::fs::create_dir_all(&dir);
        let path = self.ballots_path();
        if let Ok(json) = serde_json::to_string(&ballot.to_dict()) {
            let _ = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
                .and_then(|mut f| {
                    use std::io::Write;
                    writeln!(f, "{}", json)
                });
        }
    }

    pub fn open_ballot(
        &mut self,
        policy_id: impl Into<String>,
        description: impl Into<String>,
        quorum: usize,
    ) -> BallotRecord {
        let ballot_id = format!("ballot-{}", timestamp_now());
        let ballot = BallotRecord::new(
            &ballot_id,
            policy_id,
            description,
            Vec::new(),
            "open",
            quorum,
            timestamp_now(),
            "",
        );
        self.ballots.insert(ballot_id.clone(), ballot.clone());
        self.save_ballot(&ballot);
        ballot
    }

    pub fn cast_vote(
        &mut self,
        ballot_id: &str,
        voter_did: impl Into<String>,
        value: impl Into<String>,
        rationale: impl Into<String>,
        private_key: &str,
    ) -> Option<Vote> {
        let ballot = self.ballots.get_mut(ballot_id)?;
        if ballot.status != "open" {
            return None;
        }
        let mut vote = Vote::new(voter_did, ballot_id, value, rationale, timestamp_now(), "");
        if !private_key.is_empty() {
            vote.sign(private_key);
        }
        ballot.votes.push(vote.clone());
        let saved = ballot.clone();
        self.save_ballot(&saved);
        Some(vote)
    }

    pub fn close_ballot(&mut self, ballot_id: &str) -> Option<BallotRecord> {
        let ballot = self.ballots.get_mut(ballot_id)?;
        if ballot.status != "open" {
            return None;
        }
        ballot.status = "closed".into();
        ballot.closed_at = timestamp_now();
        let saved = ballot.clone();
        self.save_ballot(&saved);
        Some(saved)
    }

    pub fn get_ballot(&self, ballot_id: &str) -> Option<&BallotRecord> {
        self.ballots.get(ballot_id)
    }

    pub fn list_ballots(&self) -> Vec<BallotRecord> {
        self.ballots.values().cloned().collect()
    }
}

pub struct GovernanceEngine {
    alp_dir: String,
    ballot: PolicyBallot,
    min_quorum: usize,
    qualified_voters: Vec<String>,
}

impl GovernanceEngine {
    pub fn new(alp_dir: impl Into<String>, min_quorum: usize) -> Self {
        let alp_dir = alp_dir.into();
        Self {
            alp_dir: alp_dir.clone(),
            ballot: PolicyBallot::new(&alp_dir),
            min_quorum,
            qualified_voters: Vec::new(),
        }
    }

    pub fn qualify(&mut self, voter_did: impl Into<String>) {
        self.qualified_voters.push(voter_did.into());
    }

    pub fn disqualify(&mut self, voter_did: &str) {
        self.qualified_voters.retain(|v| v != voter_did);
    }

    pub fn propose(
        &mut self,
        policy_id: impl Into<String>,
        description: impl Into<String>,
        quorum: Option<usize>,
    ) -> BallotRecord {
        let effective_quorum =
            quorum.unwrap_or_else(|| self.min_quorum.max(self.qualified_voters.len() / 2 + 1));
        self.ballot
            .open_ballot(policy_id, description, effective_quorum)
    }

    pub fn vote(
        &mut self,
        ballot_id: &str,
        voter_did: impl Into<String>,
        value: impl Into<String>,
        rationale: impl Into<String>,
        private_key: &str,
    ) -> HashMap<String, serde_json::Value> {
        let voter_did = voter_did.into();
        if !self.qualified_voters.contains(&voter_did) {
            let mut result = HashMap::new();
            result.insert("accepted".into(), serde_json::Value::Bool(false));
            result.insert(
                "reason".into(),
                serde_json::Value::String("voter_not_qualified".into()),
            );
            return result;
        }
        let ballot = self.ballot.get_ballot(ballot_id);
        if ballot.is_none() || ballot.unwrap().status != "open" {
            let mut result = HashMap::new();
            result.insert("accepted".into(), serde_json::Value::Bool(false));
            result.insert(
                "reason".into(),
                serde_json::Value::String("ballot_not_open".into()),
            );
            return result;
        }
        let existing = self
            .ballot
            .get_ballot(ballot_id)
            .unwrap()
            .votes
            .iter()
            .any(|v| v.voter_did == voter_did);
        if existing {
            let mut result = HashMap::new();
            result.insert("accepted".into(), serde_json::Value::Bool(false));
            result.insert(
                "reason".into(),
                serde_json::Value::String("already_voted".into()),
            );
            return result;
        }
        let vote = self
            .ballot
            .cast_vote(ballot_id, voter_did, value, rationale, private_key);
        if vote.is_none() {
            let mut result = HashMap::new();
            result.insert("accepted".into(), serde_json::Value::Bool(false));
            result.insert(
                "reason".into(),
                serde_json::Value::String("cast_failed".into()),
            );
            return result;
        }
        let mut result = HashMap::new();
        result.insert("accepted".into(), serde_json::Value::Bool(true));
        result.insert(
            "vote".into(),
            serde_json::Value::Object(
                vote.unwrap()
                    .to_dict()
                    .into_iter()
                    .map(|(k, v)| (k, v))
                    .collect(),
            ),
        );
        result
    }

    pub fn close_and_tally(&mut self, ballot_id: &str) -> GovernanceReport {
        let ballot = self.ballot.close_ballot(ballot_id);
        if ballot.is_none() {
            panic!("Ballot '{}' not found or already closed.", ballot_id);
        }
        self.tally_ballot(&ballot.unwrap())
    }

    pub fn get_report(&self, ballot_id: &str) -> Option<GovernanceReport> {
        let ballot = self.ballot.get_ballot(ballot_id)?;
        if ballot.status != "closed" {
            return None;
        }
        Some(self.tally_ballot(ballot))
    }

    pub fn list_ballots(&self) -> Vec<BallotRecord> {
        self.ballot.list_ballots()
    }

    fn tally_ballot(&self, ballot: &BallotRecord) -> GovernanceReport {
        let tally = ballot.tally();
        let total = tally.get("total").copied().unwrap_or(0);
        let result = if total < ballot.quorum {
            "quorum_not_met"
        } else if tally.get("approve").copied().unwrap_or(0)
            > tally.get("reject").copied().unwrap_or(0)
        {
            "approved"
        } else if tally.get("reject").copied().unwrap_or(0)
            > tally.get("approve").copied().unwrap_or(0)
        {
            "rejected"
        } else {
            "tied"
        };
        GovernanceReport::new(
            ballot.ballot_id.clone(),
            result,
            tally,
            ballot.created_at.clone(),
            ballot.closed_at.clone(),
        )
    }
}

impl BallotRecord {
    pub fn ballot_id(&self) -> &str {
        &self.ballot_id
    }
}

fn timestamp_now() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    now.as_millis().to_string()
}

fn simple_hash(input: &str) -> String {
    let mut hash: u64 = 0;
    for byte in input.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
    }
    format!("{:x}", hash)
}

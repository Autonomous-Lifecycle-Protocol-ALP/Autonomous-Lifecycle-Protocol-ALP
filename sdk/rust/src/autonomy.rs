use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct EditProposal {
    pub proposal_id: String,
    pub workflow_id: String,
    pub edits: Vec<HashMap<String, serde_json::Value>>,
    pub rationale: String,
    pub status: String,
    pub created_at: String,
    pub reviewed_at: Option<String>,
    pub review_note: Option<String>,
}

#[derive(Debug, Clone)]
pub struct WorkflowMutator {
    pub policy_engine: Option<crate::PolicyEngine>,
    proposals: HashMap<String, EditProposal>,
    rollback_snapshots: HashMap<String, HashMap<String, serde_json::Value>>,
}

impl WorkflowMutator {
    pub fn new() -> Self {
        Self {
            policy_engine: None,
            proposals: HashMap::new(),
            rollback_snapshots: HashMap::new(),
        }
    }

    pub fn with_policy_engine(mut self, engine: crate::PolicyEngine) -> Self {
        self.policy_engine = Some(engine);
        self
    }

    pub fn propose_edit(&mut self, workflow_id: impl Into<String>, edits: Vec<HashMap<String, serde_json::Value>>, rationale: impl Into<String>) -> EditProposal {
        let proposal_id = format!("prop-{}-{}", workflow_id.into(), self.proposals.len() + 1);
        let proposal = EditProposal {
            proposal_id: proposal_id.clone(),
            workflow_id: workflow_id.into(),
            edits,
            rationale: rationale.into(),
            status: "pending".into(),
            created_at: chrono::Utc::now().to_rfc3339(),
            reviewed_at: None,
            review_note: None,
        };
        self.proposals.insert(proposal_id.clone(), proposal.clone());
        proposal
    }

    pub fn approve(&mut self, proposal_id: &str, workflow: &HashMap<String, serde_json::Value>) -> Result<HashMap<String, serde_json::Value>, AlpError> {
        let proposal = self.proposals.get(proposal_id).ok_or_else(|| AlpError::new(format!("Proposal {} not found.", proposal_id)))?;
        if let Some(ref engine) = self.policy_engine {
            let _ = engine.evaluate(&crate::PolicyQuery::new("edits", proposal_id));
        }
        self.rollback_snapshots.insert(proposal_id.into(), workflow.clone());
        let mut updated = workflow.clone();
        for edit in &proposal.edits {
            for (key, value) in edit {
                updated.insert(key.clone(), value.clone());
            }
        }
        Ok(updated)
    }

    pub fn rollback(&mut self, proposal_id: &str) -> Option<HashMap<String, serde_json::Value>> {
        let snapshot = self.rollback_snapshots.remove(proposal_id);
        if let Some(mut proposal) = self.proposals.get_mut(proposal_id) {
            proposal.status = "rolled_back".into();
        }
        snapshot
    }
}

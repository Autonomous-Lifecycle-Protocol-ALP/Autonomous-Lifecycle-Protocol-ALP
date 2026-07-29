use std::collections::HashMap;

pub struct AutonomyController {
    mutator: WorkflowMutator,
    decisions: Vec<HashMap<String, String>>,
}

impl AutonomyController {
    pub fn new(mutator: WorkflowMutator) -> Self {
        Self {
            mutator,
            decisions: Vec::new(),
        }
    }

    pub fn propose_edit(&mut self, workflow_id: impl Into<String>, edits: Vec<HashMap<String, serde_json::Value>>, rationale: impl Into<String>) -> EditProposal {
        let proposal = self.mutator.propose_edit(workflow_id, edits, rationale);
        let mut decision = HashMap::new();
        decision.insert("action".into(), "propose".into());
        decision.insert("proposal_id".into(), proposal.proposal_id.clone());
        decision.insert("note".into(), proposal.rationale.clone());
        self.decisions.push(decision);
        proposal
    }

    pub fn approve_edit(&mut self, proposal_id: &str, workflow: &HashMap<String, serde_json::Value>) -> Result<HashMap<String, serde_json::Value>, AlpError> {
        let updated = self.mutator.approve(proposal_id, workflow)?;
        let mut decision = HashMap::new();
        decision.insert("action".into(), "approve".into());
        decision.insert("proposal_id".into(), proposal_id.into());
        decision.insert("note".into(), "approved".into());
        self.decisions.push(decision);
        Ok(updated)
    }

    pub fn decisions(&self) -> &[HashMap<String, String>] {
        &self.decisions
    }
}

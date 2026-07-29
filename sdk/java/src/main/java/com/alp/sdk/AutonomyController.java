package com.alp.sdk;

import java.util.*;

public class AutonomyController {
    private final WorkflowMutator mutator;
    private final List<Map<String, Object>> decisions = new ArrayList<>();

    public AutonomyController(WorkflowMutator mutator) {
        this.mutator = mutator;
    }

    public EditProposal proposeEdit(String workflowId, List<Map<String, Object>> edits, String rationale) {
        EditProposal proposal = mutator.proposeEdit(workflowId, edits, rationale);
        recordDecision("propose", workflowId, proposal.getProposalId(), rationale);
        return proposal;
    }

    public Map<String, Object> approveEdit(String proposalId, Map<String, Object> workflow) {
        Map<String, Object> updated = mutator.approve(proposalId, workflow);
        recordDecision("approve", null, proposalId, "approved");
        return updated;
    }

    public List<Map<String, Object>> getDecisions() {
        return new ArrayList<>(decisions);
    }

    private void recordDecision(String action, String workflowId, String proposalId, String note) {
        Map<String, Object> decision = new LinkedHashMap<>();
        decision.put("action", action);
        decision.put("workflow_id", workflowId);
        decision.put("proposal_id", proposalId);
        decision.put("note", note);
        decision.put("ts", new Date().toString());
        decisions.add(decision);
    }
}

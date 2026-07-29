package com.alp.sdk;

import java.util.*;

public class WorkflowMutator {
    private final PolicyEngine policyEngine;
    private final Map<String, EditProposal> proposals = new LinkedHashMap<>();
    private final Map<String, Map<String, Object>> rollbackSnapshots = new LinkedHashMap<>();

    public WorkflowMutator() {
        this(null);
    }

    public WorkflowMutator(PolicyEngine policyEngine) {
        this.policyEngine = policyEngine;
    }

    public EditProposal proposeEdit(String workflowId, List<Map<String, Object>> edits, String rationale) {
        String proposalId = "prop-" + workflowId + "-" + (proposals.size() + 1);
        EditProposal proposal = new EditProposal(proposalId, workflowId, edits, rationale);
        proposals.put(proposalId, proposal);
        return proposal;
    }

    public Map<String, Object> approve(String proposalId, Map<String, Object> workflow) {
        EditProposal proposal = proposals.get(proposalId);
        if (proposal == null) {
            throw new AlpError("Proposal " + proposalId + " not found.");
        }
        if (policyEngine != null) {
            try {
                policyEngine.evaluate(new PolicyQuery("edits", proposalId));
            } catch (Exception exc) {
                proposal.setStatus("denied");
                proposal.setReviewedAt(new Date().toString());
                proposal.setReviewNote(exc.getMessage());
                throw new AlpError("Policy denied proposal: " + proposalId, exc);
            }
        }
        rollbackSnapshots.put(proposalId, new LinkedHashMap<>(workflow));
        Map<String, Object> updated = new LinkedHashMap<>(workflow);
        for (Map<String, Object> edit : proposal.getEdits()) {
            applyEdit(updated, edit);
        }
        proposal.setStatus("approved");
        proposal.setReviewedAt(new Date().toString());
        proposal.setReviewNote("approved");
        return updated;
    }

    public Map<String, Object> rollback(String proposalId) {
        Map<String, Object> snapshot = rollbackSnapshots.remove(proposalId);
        EditProposal proposal = proposals.get(proposalId);
        if (proposal != null) {
            proposal.setStatus("rolled_back");
        }
        return snapshot;
    }

    @SuppressWarnings("unchecked")
    private void applyEdit(Map<String, Object> workflow, Map<String, Object> edit) {
        for (Map.Entry<String, Object> entry : edit.entrySet()) {
            workflow.put(entry.getKey(), entry.getValue());
        }
    }
}

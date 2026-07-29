package com.alp.sdk;

import java.util.*;

public class EditProposal {
    private String proposalId;
    private String workflowId;
    private List<Map<String, Object>> edits;
    private String rationale;
    private String status;
    private String createdAt;
    private String reviewedAt;
    private String reviewNote;

    public EditProposal() {}

    public EditProposal(String proposalId, String workflowId, List<Map<String, Object>> edits, String rationale) {
        this.proposalId = proposalId;
        this.workflowId = workflowId;
        this.edits = edits;
        this.rationale = rationale;
        this.status = "pending";
        this.createdAt = new Date().toString();
    }

    public String getProposalId() { return proposalId; }
    public EditProposal setProposalId(String proposalId) { this.proposalId = proposalId; return this; }
    public String getWorkflowId() { return workflowId; }
    public EditProposal setWorkflowId(String workflowId) { this.workflowId = workflowId; return this; }
    public List<Map<String, Object>> getEdits() { return edits; }
    public EditProposal setEdits(List<Map<String, Object>> edits) { this.edits = edits; return this; }
    public String getRationale() { return rationale; }
    public EditProposal setRationale(String rationale) { this.rationale = rationale; return this; }
    public String getStatus() { return status; }
    public EditProposal setStatus(String status) { this.status = status; return this; }
    public String getCreatedAt() { return createdAt; }
    public EditProposal setCreatedAt(String createdAt) { this.createdAt = createdAt; return this; }
    public String getReviewedAt() { return reviewedAt; }
    public EditProposal setReviewedAt(String reviewedAt) { this.reviewedAt = reviewedAt; return this; }
    public String getReviewNote() { return reviewNote; }
    public EditProposal setReviewNote(String reviewNote) { this.reviewNote = reviewNote; return this; }
}

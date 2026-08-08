package com.alp.sdk;

public class ImprovementProposal {
    private String proposalId;
    private String lessonId;
    private String targetNodeId;
    private String action;
    private String detail;
    private double confidence;

    public ImprovementProposal(String proposalId, String lessonId, String targetNodeId, String action, String detail, double confidence) {
        this.proposalId = proposalId;
        this.lessonId = lessonId;
        this.targetNodeId = targetNodeId;
        this.action = action;
        this.detail = detail;
        this.confidence = confidence;
    }

    public String getProposalId() { return proposalId; }
    public String getLessonId() { return lessonId; }
    public String getTargetNodeId() { return targetNodeId; }
    public String getAction() { return action; }
    public String getDetail() { return detail; }
    public double getConfidence() { return confidence; }
}

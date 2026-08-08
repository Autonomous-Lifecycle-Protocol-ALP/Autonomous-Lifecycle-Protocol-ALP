package com.alp.sdk;

import java.util.ArrayList;
import java.util.List;

public class ReasoningChain {
    private String chainId;
    private String goal;
    private List<ReasoningStep> steps;
    private String createdAt;
    private String status;
    private String result;

    public ReasoningChain(String chainId, String goal) {
        this.chainId = chainId;
        this.goal = goal;
        this.steps = new ArrayList<>();
        this.createdAt = java.time.Instant.now().toString();
        this.status = "draft";
    }

    public String getChainId() { return chainId; }
    public String getGoal() { return goal; }
    public List<ReasoningStep> getSteps() { return steps; }
    public String getCreatedAt() { return createdAt; }
    public String getStatus() { return status; }
    public String getResult() { return result; }

    public void setStatus(String status) { this.status = status; }
    public void setResult(String result) { this.result = result; }
}

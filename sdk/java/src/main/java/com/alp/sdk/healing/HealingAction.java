package com.alp.sdk.healing;

import java.util.Map;

public class HealingAction {
    private HealingStrategy strategy;
    private String taskId;
    private String workflowId;
    private int attempt;
    private String reason;
    private boolean succeeded;
    private String timestamp;
    private Map<String, Object> metadata;

    public HealingAction(HealingStrategy strategy, String taskId, String workflowId, int attempt, String reason, boolean succeeded, String timestamp, Map<String, Object> metadata) {
        this.strategy = strategy;
        this.taskId = taskId;
        this.workflowId = workflowId;
        this.attempt = attempt;
        this.reason = reason;
        this.succeeded = succeeded;
        this.timestamp = timestamp;
        this.metadata = metadata;
    }

    public HealingStrategy getStrategy() {
        return strategy;
    }

    public String getTaskId() {
        return taskId;
    }

    public String getWorkflowId() {
        return workflowId;
    }

    public int getAttempt() {
        return attempt;
    }

    public String getReason() {
        return reason;
    }

    public boolean isSucceeded() {
        return succeeded;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }
}

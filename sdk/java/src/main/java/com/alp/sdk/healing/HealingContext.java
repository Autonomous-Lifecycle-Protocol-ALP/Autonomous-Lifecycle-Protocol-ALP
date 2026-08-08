package com.alp.sdk.healing;

import java.util.Map;

public class HealingContext {
    private String taskId;
    private String workflowId;
    private int attempt;
    private String error;
    private String timestamp;
    private Map<String, Object> metadata;

    public HealingContext(String taskId, String workflowId, int attempt, String error, String timestamp, Map<String, Object> metadata) {
        this.taskId = taskId;
        this.workflowId = workflowId;
        this.attempt = attempt;
        this.error = error;
        this.timestamp = timestamp;
        this.metadata = metadata;
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

    public String getError() {
        return error;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }
}

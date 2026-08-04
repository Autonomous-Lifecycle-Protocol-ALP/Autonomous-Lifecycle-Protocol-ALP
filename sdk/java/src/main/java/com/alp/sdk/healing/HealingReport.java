package com.alp.sdk.healing;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class HealingReport {
    private String workflowId;
    private List<HealingAction> actions;
    private String startedAt;
    private String finishedAt;

    public HealingReport(String workflowId) {
        this.workflowId = workflowId;
        this.actions = new ArrayList<>();
        this.startedAt = nowIso();
    }

    public void addAction(HealingAction action) {
        this.actions.add(action);
    }

    public String getWorkflowId() {
        return workflowId;
    }

    public List<HealingAction> getActions() {
        return actions;
    }

    public String getStartedAt() {
        return startedAt;
    }

    public String getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(String finishedAt) {
        this.finishedAt = finishedAt;
    }

    public Map<String, Object> toMap() {
        int succeeded = 0;
        int failed = 0;
        for (HealingAction a : actions) {
            if (a.isSucceeded()) {
                succeeded++;
            } else {
                failed++;
            }
        }
        return Map.of(
                "workflow_id", workflowId,
                "started_at", startedAt,
                "finished_at", finishedAt != null ? finishedAt : nowIso(),
                "actions", actionsToMaps(actions),
                "total_actions", actions.size(),
                "succeeded", succeeded,
                "failed", failed
        );
    }

    public String summary() {
        Map<String, Object> d = toMap();
        return String.format("HealingReport(workflow=%s, actions=%d, succeeded=%d, failed=%d)",
                d.get("workflow_id"), d.get("total_actions"), d.get("succeeded"), d.get("failed"));
    }

    private static List<Map<String, Object>> actionsToMaps(List<HealingAction> actions) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (HealingAction a : actions) {
            out.add(Map.of(
                    "strategy", a.getStrategy().getValue(),
                    "task_id", a.getTaskId(),
                    "workflow_id", a.getWorkflowId(),
                    "attempt", a.getAttempt(),
                    "reason", a.getReason(),
                    "succeeded", a.isSucceeded(),
                    "timestamp", a.getTimestamp(),
                    "metadata", a.getMetadata()
            ));
        }
        return out;
    }

    private static String nowIso() {
        return java.time.Instant.now().toString();
    }
}

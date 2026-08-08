package com.alp.sdk;

import java.util.*;

public class Plan {
    private String planId;
    private String goal;
    private List<PlanNode> nodes;
    private Map<String, Object> metadata;

    public Plan(String planId, String goal, List<PlanNode> nodes, Map<String, Object> metadata) {
        this.planId = planId;
        this.goal = goal;
        this.nodes = nodes != null ? nodes : new ArrayList<>();
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }

    public String getPlanId() { return planId; }
    public String getGoal() { return goal; }
    public List<PlanNode> getNodes() { return nodes; }
    public Map<String, Object> getMetadata() { return metadata; }
}

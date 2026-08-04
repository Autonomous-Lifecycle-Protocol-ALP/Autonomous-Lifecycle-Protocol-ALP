package com.alp.sdk;

import java.util.*;

public class CollabPlanner {
    private Object estimator;

    public CollabPlanner(Object estimator) {
        this.estimator = estimator;
    }

    public Plan build(String goal, Map<String, Object> constraints) {
        if (constraints == null) {
            constraints = new HashMap<>();
        }
        GoalDecomposer decomposer = new GoalDecomposer();
        Plan plan = decomposer.decompose(goal, constraints);
        if (plan == null) {
            return null;
        }
        Planner planner = new Planner();
        List<Plan> plans = new ArrayList<>();
        plans.add(plan);
        List<RankedPlan> ranked = planner.rank(plans);
        if (!ranked.isEmpty()) {
            plan = ranked.get(0).getPlan();
        }
        if (estimator != null) {
            plan.getMetadata().put("negotiation", "accepted");
        }
        return plan;
    }
}

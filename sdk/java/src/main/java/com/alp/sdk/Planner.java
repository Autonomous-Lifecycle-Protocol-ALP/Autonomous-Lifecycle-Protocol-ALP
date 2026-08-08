package com.alp.sdk;

import java.util.*;

public class Planner {
    public List<RankedPlan> rank(List<Plan> plans) {
        List<RankedPlan> scored = new ArrayList<>();
        for (Plan plan : plans) {
            scored.add(new RankedPlan(plan, score(plan)));
        }
        scored.sort((a, b) -> Double.compare(b.getScore().getComposite(), a.getScore().getComposite()));
        for (int i = 0; i < scored.size(); i++) {
            scored.get(i).setRank(i + 1);
        }
        return scored;
    }

    public PlanScore score(Plan plan) {
        int nodeCount = plan.getNodes().size();
        int depth = maxDepth(plan);
        double risk = 0.5;
        String confidence = "low";
        double complexity = nodeCount * 0.1 + depth * 0.2;
        double composite = Math.max(0.0, 1.0 - risk - complexity * 0.1);
        return new PlanScore(nodeCount, depth, risk, confidence,
            Math.round(complexity * 10000.0) / 10000.0,
            Math.round(composite * 10000.0) / 10000.0);
    }

    private int maxDepth(Plan plan) {
        if (plan.getNodes().isEmpty()) {
            return 0;
        }
        Map<String, Integer> depths = new HashMap<>();
        for (PlanNode n : plan.getNodes()) {
            depths.put(n.getId(), 1);
        }
        for (PlanNode n : plan.getNodes()) {
            for (String dep : n.getDependsOn()) {
                if (depths.containsKey(dep)) {
                    depths.put(n.getId(), Math.max(depths.get(n.getId()), depths.get(dep) + 1));
                }
            }
        }
        int m = 0;
        for (int d : depths.values()) {
            if (d > m) m = d;
        }
        return m;
    }
}

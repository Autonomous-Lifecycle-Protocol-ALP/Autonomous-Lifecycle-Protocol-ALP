package com.alp.sdk;

import java.util.*;
import java.util.regex.Pattern;

public class GoalDecomposer {
    public Plan decompose(String goal, Map<String, Object> constraints) {
        String trimmed = goal != null ? goal.trim() : "";
        if (trimmed.isEmpty()) {
            return null;
        }
        String planId = sanitizeGoal(trimmed);
        List<String> steps = extractVerbs(trimmed);
        List<PlanNode> nodes = new ArrayList<>();
        for (int i = 0; i < steps.size(); i++) {
            List<String> deps = new ArrayList<>();
            if (i > 0) {
                deps.add("step-" + i);
            }
            nodes.add(new PlanNode("step-" + (i + 1), "task", steps.get(i), deps));
        }
        Map<String, Object> meta = new HashMap<>();
        meta.put("constraints", constraints != null ? constraints : new HashMap<>());
        return new Plan(planId, trimmed, nodes, meta);
    }

    public Plan toWorkflow(Plan plan) {
        return plan;
    }

    private List<String> extractVerbs(String goal) {
        List<String> verbs = new ArrayList<>();
        for (String w : goal.split("\\s+")) {
            String clean = w.replaceAll("^[.,!?:;]+|[.,!?:;]+$", "");
            if (!clean.isEmpty() && Character.isUpperCase(clean.charAt(0))) {
                verbs.add(clean);
            }
        }
        if (verbs.isEmpty()) {
            verbs.add(goal);
        }
        return verbs;
    }

    private String sanitizeGoal(String goal) {
        String s = goal.toLowerCase().replaceAll("[^a-z0-9_-]+", "-");
        if (s.length() > 40) {
            s = s.substring(0, 40);
        }
        return s.isEmpty() ? "plan" : s;
    }
}

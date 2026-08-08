package com.alp.sdk;

import java.util.*;

public class PolicyLearner {
    private List<PolicyContext> history;

    public PolicyLearner() {
        this.history = new ArrayList<>();
    }

    public void learn(PolicyContext ctx) {
        history.add(ctx);
    }

    public List<String> suggest(Map<String, String> env) {
        List<String> candidates = new ArrayList<>();
        for (PolicyContext ctx : history) {
            if (matchEnvironment(env, ctx.getEnvironment())) {
                candidates.add(String.join(",", ctx.getTags()));
            }
        }
        return dedupe(candidates);
    }

    public List<PolicyContext> history() {
        return new ArrayList<>(history);
    }

    private boolean matchEnvironment(Map<String, String> a, Map<String, String> b) {
        if (a.isEmpty() || b.isEmpty()) {
            return false;
        }
        int matches = 0;
        for (Map.Entry<String, String> e : a.entrySet()) {
            if (b.get(e.getKey()).equals(e.getValue())) {
                matches++;
            }
        }
        return matches > 0;
    }

    private List<String> dedupe(List<String> input) {
        Set<String> seen = new LinkedHashSet<>(input);
        return new ArrayList<>(seen);
    }
}

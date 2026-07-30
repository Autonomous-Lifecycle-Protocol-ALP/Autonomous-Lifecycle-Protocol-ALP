package com.alp.sdk;

import java.util.*;

public class PolicyEngine {
    private final List<AlpObject> policies;

    public PolicyEngine(List<AlpObject> policies) {
        this.policies = new ArrayList<>();
        for (AlpObject obj : policies) {
            if ("policy".equals(obj.getType())) {
                this.policies.add(obj);
            }
        }
    }

    public int getCount() {
        return policies.size();
    }

    public PolicyDecision evaluate(PolicyQuery query) {
        List<String> reasons = new ArrayList<>();
        List<String> matchedPolicies = new ArrayList<>();
        boolean blocked = false;
        boolean requiresApproval = false;

        for (AlpObject policy : policies) {
            String enforcement = (String) policy.getProperties().getOrDefault("enforcement", "strict");
            String kind = (String) policy.getProperties().getOrDefault("kind", "");
            String value = (String) policy.getProperties().getOrDefault("value", "");

            if (!matches(query, kind, value)) {
                continue;
            }

            matchedPolicies.add(policy.getId());

            if ("deny".equals(kind) || ("deny_path".equals(kind) && "path".equals(query.getKind()))
                    || ("deny_command".equals(kind) && "command".equals(query.getKind()))) {
                blocked = true;
                reasons.add("Denied by policy: " + policy.getId());
            } else if ("require_approval".equals(kind)) {
                requiresApproval = true;
                reasons.add("Requires approval: " + policy.getId());
            } else if ("warn".equals(enforcement)) {
                reasons.add("Warning: " + policy.getId());
            }
        }

        boolean allowed = !blocked;
        return new PolicyDecision(allowed, blocked, reasons, matchedPolicies, requiresApproval);
    }

    private boolean matches(PolicyQuery query, String policyKind, String policyValue) {
        if (policyValue == null || policyValue.isEmpty()) {
            return false;
        }
        if ("require_approval".equals(policyKind)) {
            String queryValue = query.getValue();
            if (queryValue == null) {
                return false;
            }
            if (policyValue.contains("*")) {
                String regex = policyValue.replace(".", "\\.").replace("*", ".*");
                return queryValue.matches(regex);
            }
            return queryValue.equals(policyValue) || queryValue.startsWith(policyValue);
        }
        if (!query.getKind().equals(policyKind.replace("deny_", "").replace("allow_", ""))) {
            return false;
        }
        String queryValue = query.getValue();
        if (queryValue == null) {
            return false;
        }
        if (policyValue.contains("*")) {
            String regex = policyValue.replace(".", "\\.").replace("*", ".*");
            return queryValue.matches(regex);
        }
        return queryValue.equals(policyValue) || queryValue.startsWith(policyValue);
    }
}

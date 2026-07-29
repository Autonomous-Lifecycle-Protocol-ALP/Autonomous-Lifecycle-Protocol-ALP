package com.alp.sdk;

public class PolicyDecision {
    private final boolean allowed;
    private final boolean blocked;
    private final List<String> reasons;
    private final List<String> policies;
    private final boolean requiresApproval;

    public PolicyDecision(boolean allowed, boolean blocked, List<String> reasons, List<String> policies, boolean requiresApproval) {
        this.allowed = allowed;
        this.blocked = blocked;
        this.reasons = reasons;
        this.policies = policies;
        this.requiresApproval = requiresApproval;
    }

    public boolean isAllowed() {
        return allowed;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public List<String> getPolicies() {
        return policies;
    }

    public boolean requiresApproval() {
        return requiresApproval;
    }
}

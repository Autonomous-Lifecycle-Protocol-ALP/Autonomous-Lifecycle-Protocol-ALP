package com.alp.sdk;

import java.util.List;
import java.util.Map;

public class PolicyDecision {
    private final boolean allowed;
    private final boolean blocked;
    private final List<String> reasons;
    private final List<String> policies;
    private final boolean requiresApproval;
    private final Map<String, Object> audit;

    public PolicyDecision(boolean allowed, boolean blocked, List<String> reasons, List<String> policies, boolean requiresApproval) {
        this(allowed, blocked, reasons, policies, requiresApproval, null);
    }

    public PolicyDecision(boolean allowed, boolean blocked, List<String> reasons, List<String> policies, boolean requiresApproval, Map<String, Object> audit) {
        this.allowed = allowed;
        this.blocked = blocked;
        this.reasons = reasons;
        this.policies = policies;
        this.requiresApproval = requiresApproval;
        this.audit = audit;
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

    public Map<String, Object> getAudit() {
        return audit;
    }
}

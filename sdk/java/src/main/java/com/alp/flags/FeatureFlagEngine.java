package com.alp.flags;

import java.time.Instant;
import java.util.*;

/**
 * FeatureFlagEngine — v74.0.0 Feature Flag Engine
 * Dynamic feature flags for agent workflows.
 */
public class FeatureFlagEngine {

    public enum FlagStatus { ENABLED, DISABLED, ROLLOUT, EXPERIMENT }

    public static class FeatureFlag {
        public String flagId;
        public String name;
        public String description;
        public FlagStatus status;
        public int rolloutPercentage;
        public boolean killSwitch;
        public String createdAt;
        public String updatedAt;

        public FeatureFlag(String id, String name, String description, FlagStatus status, int rolloutPercentage) {
            this.flagId = id;
            this.name = name;
            this.description = description;
            this.status = status;
            this.rolloutPercentage = rolloutPercentage;
            this.killSwitch = false;
            this.createdAt = Instant.now().toString();
            this.updatedAt = Instant.now().toString();
        }
    }

    public static class FlagEvaluation {
        public String flagId;
        public String agentId;
        public String environment;
        public boolean enabled;
        public String reason;

        public FlagEvaluation(String flagId, String agentId, String environment, boolean enabled, String reason) {
            this.flagId = flagId;
            this.agentId = agentId;
            this.environment = environment;
            this.enabled = enabled;
            this.reason = reason;
        }
    }

    private final Map<String, FeatureFlag> flags = new LinkedHashMap<>();

    public FeatureFlag createFlag(String name, String description, FlagStatus status, int rolloutPercentage) {
        String id = "flag-" + System.nanoTime();
        FeatureFlag flag = new FeatureFlag(id, name, description, status, rolloutPercentage);
        flags.put(id, flag);
        return flag;
    }

    public FlagEvaluation evaluate(String flagId, String agentId, String environment) {
        FeatureFlag flag = flags.get(flagId);
        if (flag == null) {
            return new FlagEvaluation(flagId, agentId, environment, false, "FLAG_NOT_FOUND");
        }
        if (flag.killSwitch) {
            return new FlagEvaluation(flagId, agentId, environment, false, "KILL_SWITCH");
        }
        if (flag.status == FlagStatus.DISABLED) {
            return new FlagEvaluation(flagId, agentId, environment, false, "FLAG_DISABLED");
        }
        return new FlagEvaluation(flagId, agentId, environment, true, "FLAG_ENABLED");
    }

    public List<FeatureFlag> getFlags() {
        return new ArrayList<>(flags.values());
    }
}

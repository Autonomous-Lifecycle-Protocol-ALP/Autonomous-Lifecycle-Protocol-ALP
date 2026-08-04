package com.alp.sdk;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ExecutionQuotaEngine {
    private final Map<String, QuotaUsage> quotas = new ConcurrentHashMap<>();
    private final long resetIntervalMillis;

    public ExecutionQuotaEngine(long resetIntervalMillis) {
        this.resetIntervalMillis = resetIntervalMillis > 0 ? resetIntervalMillis : 3600000;
    }

    public void setQuota(String agentId, double limit) {
        quotas.put(agentId, new QuotaUsage(agentId, 0.0, limit, limit, System.currentTimeMillis()));
    }

    public boolean consume(String agentId, double amount) {
        if (amount <= 0) {
            return true;
        }
        QuotaUsage q = quotas.get(agentId);
        if (q == null) {
            throw new IllegalArgumentException("quota not set for agent '" + agentId + "'");
        }
        synchronized (q) {
            if (System.currentTimeMillis() - q.getLastChecked() >= resetIntervalMillis) {
                q.setUsed(0.0);
                q.setRemaining(q.getLimit());
                q.setLastChecked(System.currentTimeMillis());
            }
            if (q.getRemaining() < amount) {
                return false;
            }
            q.setUsed(q.getUsed() + amount);
            q.setRemaining(q.getRemaining() - amount);
            q.setLastChecked(System.currentTimeMillis());
            return true;
        }
    }

    public double remaining(String agentId) {
        QuotaUsage q = quotas.get(agentId);
        if (q == null) {
            throw new IllegalArgumentException("quota not set for agent '" + agentId + "'");
        }
        return q.getRemaining();
    }

    public void reset(String agentId) {
        QuotaUsage q = quotas.get(agentId);
        if (q != null) {
            synchronized (q) {
                q.setUsed(0.0);
                q.setRemaining(q.getLimit());
                q.setLastChecked(System.currentTimeMillis());
            }
        }
    }

    public void resetAll() {
        for (QuotaUsage q : quotas.values()) {
            synchronized (q) {
                q.setUsed(0.0);
                q.setRemaining(q.getLimit());
                q.setLastChecked(System.currentTimeMillis());
            }
        }
    }

    private static class QuotaUsage {
        private final String agentId;
        private double used;
        private final double limit;
        private double remaining;
        private long lastChecked;

        QuotaUsage(String agentId, double used, double limit, double remaining, long lastChecked) {
            this.agentId = agentId;
            this.used = used;
            this.limit = limit;
            this.remaining = remaining;
            this.lastChecked = lastChecked;
        }

        String getAgentId() { return agentId; }
        double getUsed() { return used; }
        void setUsed(double used) { this.used = used; }
        double getLimit() { return limit; }
        double getRemaining() { return remaining; }
        void setRemaining(double remaining) { this.remaining = remaining; }
        long getLastChecked() { return lastChecked; }
        void setLastChecked(long lastChecked) { this.lastChecked = lastChecked; }
    }
}

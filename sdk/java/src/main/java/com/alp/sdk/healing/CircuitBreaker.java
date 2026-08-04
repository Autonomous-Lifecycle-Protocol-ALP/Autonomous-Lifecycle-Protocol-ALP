package com.alp.sdk.healing;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CircuitBreaker {
    private final int failureThreshold;
    private final long recoveryTimeoutNanos;
    private final Map<String, Integer> failures = new ConcurrentHashMap<>();
    private final Map<String, Long> lastFailureTs = new ConcurrentHashMap<>();

    public CircuitBreaker(int failureThreshold, long recoveryTimeoutNanos) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeoutNanos = recoveryTimeoutNanos;
    }

    public synchronized void recordFailure(String taskId) {
        failures.put(taskId, failures.getOrDefault(taskId, 0) + 1);
        lastFailureTs.put(taskId, System.nanoTime());
    }

    public synchronized void recordSuccess(String taskId) {
        failures.remove(taskId);
        lastFailureTs.remove(taskId);
    }

    public synchronized boolean isOpen(String taskId) {
        int f = failures.getOrDefault(taskId, 0);
        if (f < failureThreshold) {
            return false;
        }
        long last = lastFailureTs.getOrDefault(taskId, 0L);
        if ((System.nanoTime() - last) > recoveryTimeoutNanos) {
            failures.remove(taskId);
            lastFailureTs.remove(taskId);
            return false;
        }
        return true;
    }

    public synchronized void reset(String taskId) {
        failures.remove(taskId);
        lastFailureTs.remove(taskId);
    }
}

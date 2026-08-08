package com.alp.sdk;

import java.util.*;

public class EmergentBehaviorDetector {
    private final double threshold;

    public EmergentBehaviorDetector(double threshold) {
        this.threshold = threshold > 0 ? threshold : 0.8;
    }

    public List<String> detect(List<AgentRecord> agents) {
        List<String> signs = new ArrayList<>();
        if (agents.size() > 1) {
            List<Double> loads = new ArrayList<>();
            for (AgentRecord a : agents) {
                loads.add(a.getLoad() / Math.max(a.getCapacity(), 0.001));
            }
            double avg = loads.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double variance = loads.stream().mapToDouble(x -> Math.pow(x - avg, 2)).average().orElse(0.0);
            double std = Math.sqrt(variance);
            if (std > 0.25) {
                signs.add(String.format("load_variance=%.4f", std));
            }
        }
        Map<String, Integer> roleCount = new HashMap<>();
        for (AgentRecord a : agents) {
            roleCount.merge(a.getRole(), 1, Integer::sum);
        }
        if (!roleCount.isEmpty()) {
            int minCount = agents.size();
            int maxCount = 0;
            for (int c : roleCount.values()) {
                minCount = Math.min(minCount, c);
                maxCount = Math.max(maxCount, c);
            }
            double imbalance = maxCount > 0 ? (double) (maxCount - minCount) / maxCount : 0.0;
            if (imbalance > 0.4) {
                signs.add(String.format("role_imbalance=%.4f", imbalance));
            }
        }
        return signs;
    }
}

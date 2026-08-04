package com.alp.sdk;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReasoningTracer {
    private Map<String, ReasoningChain> chains;
    private int stepCounter;

    public ReasoningTracer() {
        this.chains = new HashMap<>();
        this.stepCounter = 0;
    }

    public ReasoningChain createChain(String goal) {
        String chainId = "chain-" + System.currentTimeMillis() + "-" + randomSuffix(5);
        ReasoningChain chain = new ReasoningChain(chainId, goal);
        chains.put(chainId, chain);
        return chain;
    }

    public ReasoningStep addStep(String chainId, ReasoningStep input) {
        ReasoningChain chain = chains.get(chainId);
        if (chain == null) {
            throw new IllegalArgumentException("Reasoning chain '" + chainId + "' not found.");
        }
        if (!"executing".equals(chain.getStatus())) {
            chain.setStatus("executing");
        }
        stepCounter++;
        ReasoningStep step = new ReasoningStep(
            "step-" + chainId + "-" + stepCounter,
            input.getAgentId(),
            input.getThought(),
            input.getAction(),
            input.getConfidence(),
            input.getDependencies(),
            input.getObservation(),
            java.time.Instant.now().toString()
        );
        chain.getSteps().add(step);
        return step;
    }

    public ReasoningChain completeChain(String chainId, String result) {
        ReasoningChain chain = chains.get(chainId);
        if (chain == null) {
            throw new IllegalArgumentException("Reasoning chain '" + chainId + "' not found.");
        }
        chain.setStatus("completed");
        chain.setResult(result);
        return chain;
    }

    public ReasoningChain failChain(String chainId, String reason) {
        ReasoningChain chain = chains.get(chainId);
        if (chain == null) {
            throw new IllegalArgumentException("Reasoning chain '" + chainId + "' not found.");
        }
        chain.setStatus("failed");
        chain.setResult(reason);
        return chain;
    }

    public ReasoningChain getChain(String chainId) {
        return chains.get(chainId);
    }

    public List<ReasoningStep> getStepsByAgent(String agentId) {
        List<ReasoningStep> steps = new ArrayList<>();
        for (ReasoningChain chain : chains.values()) {
            for (ReasoningStep step : chain.getSteps()) {
                if (agentId.equals(step.getAgentId())) {
                    steps.add(step);
                }
            }
        }
        return steps;
    }

    private String randomSuffix(int n) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            int idx = (int) (System.currentTimeMillis() % chars.length());
            sb.append(chars.charAt(idx));
        }
        return sb.toString();
    }
}

package com.alp.sdk;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReasoningStep {
    private String stepId;
    private String agentId;
    private String thought;
    private String action;
    private String observation;
    private double confidence;
    private List<String> dependencies;
    private String timestamp;

    public ReasoningStep(String stepId, String agentId, String thought, String action, double confidence, List<String> dependencies, String observation, String timestamp) {
        this.stepId = stepId;
        this.agentId = agentId;
        this.thought = thought;
        this.action = action;
        this.observation = observation;
        this.confidence = confidence;
        this.dependencies = dependencies != null ? dependencies : new ArrayList<>();
        this.timestamp = timestamp != null ? timestamp : java.time.Instant.now().toString();
    }

    public String getStepId() { return stepId; }
    public String getAgentId() { return agentId; }
    public String getThought() { return thought; }
    public String getAction() { return action; }
    public String getObservation() { return observation; }
    public double getConfidence() { return confidence; }
    public List<String> getDependencies() { return dependencies; }
    public String getTimestamp() { return timestamp; }
}

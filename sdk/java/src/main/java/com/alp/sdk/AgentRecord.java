package com.alp.sdk;

import java.util.*;

public class AgentRecord {
    private String agentId;
    private String role;
    private double load;
    private double capacity;
    private double successRate;
    private List<String> specializations;

    public AgentRecord(String agentId, String role, double load, double capacity, double successRate, List<String> specializations) {
        this.agentId = agentId;
        this.role = role;
        this.load = load;
        this.capacity = capacity;
        this.successRate = successRate;
        this.specializations = specializations != null ? specializations : new ArrayList<>();
    }

    public String getAgentId() { return agentId; }
    public String getRole() { return role; }
    public double getLoad() { return load; }
    public double getCapacity() { return capacity; }
    public double getSuccessRate() { return successRate; }
    public List<String> getSpecializations() { return specializations; }
}

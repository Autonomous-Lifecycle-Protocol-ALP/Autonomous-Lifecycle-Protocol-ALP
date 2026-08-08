package com.alp.sdk;

import java.util.*;

public class RoleSpecializer {
    public Map<String, String> assignRoles(List<AgentRecord> agents) {
        Map<String, String> assignments = new HashMap<>();
        for (AgentRecord agent : agents) {
            String bestRole = agent.getRole();
            double bestScore = 0.0;
            for (String spec : agent.getSpecializations()) {
                double score = agent.getSuccessRate() * (1.0 - agent.getLoad() / Math.max(agent.getCapacity(), 0.001));
                if (score > bestScore) {
                    bestScore = score;
                    bestRole = spec;
                }
            }
            assignments.put(agent.getAgentId(), bestRole);
        }
        return assignments;
    }
}

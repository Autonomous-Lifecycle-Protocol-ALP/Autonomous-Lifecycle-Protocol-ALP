package com.alp.sdk;

import java.util.*;

public class CollectiveDecisionMaker {
    private final int quorum;

    public CollectiveDecisionMaker(int quorum) {
        this.quorum = quorum > 0 ? quorum : 3;
    }

    public SwarmDecision decide(List<String> proposals, List<AgentRecord> voters) {
        if (proposals.isEmpty() || voters.isEmpty()) {
            return null;
        }
        Map<String, Integer> votes = new HashMap<>();
        List<String> participants = new ArrayList<>();
        for (AgentRecord voter : voters) {
            if (voter.getLoad() < 0.9) {
                int idx = (int) (voter.getSuccessRate() * proposals.size()) % proposals.size();
                String choice = proposals.get(idx);
                votes.merge(choice, 1, Integer::sum);
                participants.add(voter.getAgentId());
            }
        }
        List<Map.Entry<String, Integer>> ranked = new ArrayList<>(votes.entrySet());
        ranked.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        if (ranked.isEmpty()) {
            return null;
        }
        Map.Entry<String, Integer> winner = ranked.get(0);
        return new SwarmDecision(
            "decision-" + participants.size(),
            winner.getKey(),
            (double) winner.getValue() / participants.size(),
            winner.getValue(),
            winner.getValue() >= quorum,
            participants
        );
    }
}

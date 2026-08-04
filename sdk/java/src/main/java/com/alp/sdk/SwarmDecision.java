package com.alp.sdk;

import java.util.*;

public class SwarmDecision {
    private String decisionId;
    private String proposal;
    private double score;
    private int votes;
    private boolean quorumMet;
    private List<String> participants;

    public SwarmDecision(String decisionId, String proposal, double score, int votes, boolean quorumMet, List<String> participants) {
        this.decisionId = decisionId;
        this.proposal = proposal;
        this.score = score;
        this.votes = votes;
        this.quorumMet = quorumMet;
        this.participants = participants;
    }

    public String getDecisionId() { return decisionId; }
    public String getProposal() { return proposal; }
    public double getScore() { return score; }
    public int getVotes() { return votes; }
    public boolean isQuorumMet() { return quorumMet; }
    public List<String> getParticipants() { return participants; }
}

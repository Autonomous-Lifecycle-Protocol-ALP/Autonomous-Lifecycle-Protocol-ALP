package com.alp.sdk;

import java.time.Instant;

/**
 * BFT Consensus Engine for ALP v48.0.0.
 * Implements Byzantine Fault Tolerant voting and 2f+1 quorum calculation.
 */
public class BFTConsensusEngine {

    public static class BFTProposal {
        private final String id;
        private final String proposerNodeId;
        private final String value;
        private final int totalNodes;
        private final int maxFaultyNodes;
        private final int requiredQuorum;
        private boolean committed;
        private final String createdAt;

        public BFTProposal(String id, String proposerNodeId, String value, int totalNodes, int maxFaultyNodes, int requiredQuorum) {
            this.id = id;
            this.proposerNodeId = proposerNodeId;
            this.value = value;
            this.totalNodes = totalNodes;
            this.maxFaultyNodes = maxFaultyNodes;
            this.requiredQuorum = requiredQuorum;
            this.committed = false;
            this.createdAt = Instant.now().toString();
        }

        public String getId() { return id; }
        public String getProposerNodeId() { return proposerNodeId; }
        public String getValue() { return value; }
        public int getTotalNodes() { return totalNodes; }
        public int getMaxFaultyNodes() { return maxFaultyNodes; }
        public int getRequiredQuorum() { return requiredQuorum; }
        public boolean isCommitted() { return committed; }
        public void setCommitted(boolean committed) { this.committed = committed; }
        public String getCreatedAt() { return createdAt; }
    }

    public BFTProposal createProposal(String id, String proposerNodeId, String value, int totalNodes) {
        int maxFaulty = (totalNodes - 1) / 3;
        int requiredQuorum = 2 * maxFaulty + 1;
        return new BFTProposal(id, proposerNodeId, value, totalNodes, maxFaulty, requiredQuorum);
    }
}

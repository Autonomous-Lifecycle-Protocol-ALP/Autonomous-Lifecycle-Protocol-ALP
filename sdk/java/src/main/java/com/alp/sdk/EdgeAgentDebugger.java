package com.alp.sdk;

/**
 * EdgeAgentDebugger for ALP v68.0.0.
 * Cloud edge agent live debugging and remote session attachment.
 */
public class EdgeAgentDebugger {

    public static class DebugSession {
        private final String sessionId;
        private final String agentId;
        private final String edgeNodeId;
        private final String status;

        public DebugSession(String sessionId, String agentId, String edgeNodeId, String status) {
            this.sessionId = sessionId;
            this.agentId = agentId;
            this.edgeNodeId = edgeNodeId;
            this.status = status;
        }

        public String getSessionId() { return sessionId; }
        public String getAgentId() { return agentId; }
        public String getEdgeNodeId() { return edgeNodeId; }
        public String getStatus() { return status; }
    }

    public DebugSession attachSession(String agentId, String edgeNodeId) {
        String sessionId = "debug-" + agentId + "-1";
        return new DebugSession(sessionId, agentId, edgeNodeId, "PAUSED");
    }
}

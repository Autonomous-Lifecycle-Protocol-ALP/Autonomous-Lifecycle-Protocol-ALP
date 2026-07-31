package com.alp.sdk;

/**
 * CRDTCanvasEngine for ALP v64.0.0.
 * Real-time multiplayer CRDT canvas and peer presence synchronization.
 */
public class CRDTCanvasEngine {

    public static class PeerPresence {
        private final String peerId;
        private final String username;
        private final String color;

        public PeerPresence(String peerId, String username, String color) {
            this.peerId = peerId;
            this.username = username;
            this.color = color;
        }

        public String getPeerId() { return peerId; }
        public String getUsername() { return username; }
        public String getColor() { return color; }
    }

    private final String canvasId;

    public CRDTCanvasEngine(String canvasId) {
        this.canvasId = canvasId != null ? canvasId : "canvas-main";
    }

    public String getCanvasId() {
        return canvasId;
    }

    public PeerPresence registerPeer(String peerId, String username, String color) {
        String peerColor = color != null ? color : "#4fc3f7";
        return new PeerPresence(peerId, username, peerColor);
    }
}

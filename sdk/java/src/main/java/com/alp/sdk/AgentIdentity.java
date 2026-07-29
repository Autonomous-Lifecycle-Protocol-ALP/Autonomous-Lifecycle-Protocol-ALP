package com.alp.sdk;

import java.util.*;

public class AgentIdentity {
    private String did;
    private String agentId;
    private String publicKey;
    private String createdAt;
    private Map<String, Object> metadata;

    public AgentIdentity(String did, String agentId, String publicKey) {
        this(did, agentId, publicKey, "", new LinkedHashMap<>());
    }

    public AgentIdentity(String did, String agentId, String publicKey, String createdAt, Map<String, Object> metadata) {
        this.did = did;
        this.agentId = agentId;
        this.publicKey = publicKey;
        this.createdAt = createdAt.isEmpty() ? new Date().toString() : createdAt;
        this.metadata = metadata != null ? metadata : new LinkedHashMap<>();
    }

    public String getDid() { return did; }
    public String getAgentId() { return agentId; }
    public String getPublicKey() { return publicKey; }
    public String getCreatedAt() { return createdAt; }
    public Map<String, Object> getMetadata() { return metadata; }

    public Map<String, Object> toDict() {
        Map<String, Object> dict = new LinkedHashMap<>();
        dict.put("did", did);
        dict.put("agent_id", agentId);
        dict.put("public_key", publicKey);
        dict.put("created_at", createdAt);
        dict.put("metadata", metadata);
        return dict;
    }

    public static AgentIdentity fromDict(Map<String, Object> d) {
        String did = (String) d.getOrDefault("did", d.get("did"));
        String agentId = (String) d.getOrDefault("agent_id", d.get("agent_id"));
        String publicKey = (String) d.getOrDefault("public_key", d.get("public_key"));
        String createdAt = (String) d.getOrDefault("created_at", "");
        Map<String, Object> metadata = (Map<String, Object>) d.getOrDefault("metadata", new LinkedHashMap<>());
        return new AgentIdentity(did, agentId, publicKey, createdAt, metadata);
    }
}

package com.alp.sdk;

import java.util.*;

public class TrustEntry {
    private String agentId;
    private List<String> scopes;
    private String trustLevel;
    private String registeredAt;

    public TrustEntry(String agentId, List<String> scopes, String trustLevel, String registeredAt) {
        this.agentId = agentId;
        this.scopes = scopes != null ? scopes : new ArrayList<>();
        this.trustLevel = trustLevel;
        this.registeredAt = registeredAt;
    }

    public String getAgentId() { return agentId; }
    public List<String> getScopes() { return scopes; }
    public String getTrustLevel() { return trustLevel; }
    public String getRegisteredAt() { return registeredAt; }
}

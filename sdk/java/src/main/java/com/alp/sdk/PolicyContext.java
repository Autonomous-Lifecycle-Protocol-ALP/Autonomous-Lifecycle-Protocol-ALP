package com.alp.sdk;

import java.util.*;

public class PolicyContext {
    private String contextId;
    private Map<String, String> environment;
    private List<String> tags;

    public PolicyContext(String contextId, Map<String, String> environment, List<String> tags) {
        this.contextId = contextId;
        this.environment = environment != null ? environment : new HashMap<>();
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public String getContextId() { return contextId; }
    public Map<String, String> getEnvironment() { return environment; }
    public List<String> getTags() { return tags; }
}

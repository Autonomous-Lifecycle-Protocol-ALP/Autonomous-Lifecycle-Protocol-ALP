package com.alp.sdk;

public class PolicyQuery {
    private final String kind;
    private final String value;
    private final String agent;

    public PolicyQuery(String kind, String value) {
        this(kind, value, null);
    }

    public PolicyQuery(String kind, String value, String agent) {
        this.kind = kind;
        this.value = value;
        this.agent = agent;
    }

    public String getKind() {
        return kind;
    }

    public String getValue() {
        return value;
    }

    public String getAgent() {
        return agent;
    }
}

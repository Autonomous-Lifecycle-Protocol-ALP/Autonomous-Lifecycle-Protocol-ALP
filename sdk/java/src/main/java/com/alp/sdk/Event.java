package com.alp.sdk;

import java.util.*;

public class Event {
    private final Map<String, Object> payload;
    private final String timestamp;

    public Event(Map<String, Object> payload, String timestamp) {
        this.payload = payload;
        this.timestamp = timestamp;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public String getTimestamp() {
        return timestamp;
    }
}

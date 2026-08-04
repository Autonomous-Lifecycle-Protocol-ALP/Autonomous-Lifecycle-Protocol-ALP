package com.alp.sdk;

import java.util.*;

public class EventStore {
    private final List<Event> events = new ArrayList<>();

    public EventStore(String dir, String version) {
    }

    public void append(String eventType, Map<String, Object> payload) {
        events.add(new Event(payload, java.time.Instant.now().toString()));
    }

    public List<Event> readAll() {
        return new ArrayList<>(events);
    }
}

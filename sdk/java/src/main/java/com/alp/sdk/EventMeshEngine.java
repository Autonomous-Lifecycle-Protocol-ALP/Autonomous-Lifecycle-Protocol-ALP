package com.alp.sdk;

import java.util.*;

public class EventMeshEngine {
    private final Map<String, Set<EventHandler>> subscriptions = new HashMap<>();
    private final List<MeshEvent> eventBuffer = new ArrayList<>();

    public void subscribe(String topic, EventHandler handler) {
        subscriptions.computeIfAbsent(topic, k -> new HashSet<>()).add(handler);
    }

    public MeshEvent publish(String eventId, String topic, String senderAgent, String payload) {
        MeshEvent event = new MeshEvent(eventId, topic, senderAgent, payload);
        eventBuffer.add(event);
        Set<EventHandler> handlers = subscriptions.getOrDefault(topic, Collections.emptySet());
        for (EventHandler handler : handlers) {
            handler.onEvent(event);
        }
        return event;
    }

    public List<MeshEvent> getEventBuffer() {
        return new ArrayList<>(eventBuffer);
    }
}

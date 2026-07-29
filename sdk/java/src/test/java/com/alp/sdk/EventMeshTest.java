package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class EventMeshTest {

    @Test
    void publish_deliversToSubscriber() {
        EventMeshEngine mesh = new EventMeshEngine();
        List<MeshEvent> received = new ArrayList<>();

        mesh.subscribe("topic-1", event -> received.add(event));
        MeshEvent event = mesh.publish("e1", "topic-1", "agent-1", "hello");

        assertEquals(1, received.size());
        assertEquals("e1", received.get(0).getId());
        assertEquals("hello", received.get(0).getPayload());
    }

    @Test
    void publish_noSubscriber_stillBuffers() {
        EventMeshEngine mesh = new EventMeshEngine();
        MeshEvent event = mesh.publish("e1", "topic-1", "agent-1", "hello");

        List<MeshEvent> buffer = mesh.getEventBuffer();
        assertEquals(1, buffer.size());
    }
}

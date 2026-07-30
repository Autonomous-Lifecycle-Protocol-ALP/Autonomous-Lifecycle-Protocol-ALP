package com.alp.sdk;

import java.util.Date;

public class MeshEvent {
    private String id;
    private String topic;
    private String senderAgent;
    private String payload;
    private String eventType;
    private String timestamp;

    public MeshEvent() {}

    public MeshEvent(String id, String topic, String senderAgent, String payload) {
        this(id, topic, senderAgent, payload, "state_change", new Date().toString());
    }

    public MeshEvent(String id, String topic, String senderAgent, String payload, String eventType, String timestamp) {
        this.id = id;
        this.topic = topic;
        this.senderAgent = senderAgent;
        this.payload = payload;
        this.eventType = eventType;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public MeshEvent setId(String id) { this.id = id; return this; }
    public String getTopic() { return topic; }
    public MeshEvent setTopic(String topic) { this.topic = topic; return this; }
    public String getSenderAgent() { return senderAgent; }
    public MeshEvent setSenderAgent(String senderAgent) { this.senderAgent = senderAgent; return this; }
    public String getPayload() { return payload; }
    public MeshEvent setPayload(String payload) { this.payload = payload; return this; }
    public String getEventType() { return eventType; }
    public MeshEvent setEventType(String eventType) { this.eventType = eventType; return this; }
    public String getTimestamp() { return timestamp; }
    public MeshEvent setTimestamp(String timestamp) { this.timestamp = timestamp; return this; }
}

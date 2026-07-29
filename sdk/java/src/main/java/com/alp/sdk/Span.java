package com.alp.sdk;

import java.util.*;

public class Span {
    private String id;
    private String traceId;
    private String spanId;
    private String parentSpanId;
    private String agent;
    private String action;
    private long startTime;
    private Long endTime;
    private Long durationMs;
    private String status;
    private Map<String, Object> attributes;

    public Span(String id, String traceId, String spanId, String parentSpanId, String agent, String action, long startTime, String status, Map<String, Object> attributes) {
        this.id = id;
        this.traceId = traceId;
        this.spanId = spanId;
        this.parentSpanId = parentSpanId;
        this.agent = agent;
        this.action = action;
        this.startTime = startTime;
        this.status = status;
        this.attributes = attributes != null ? attributes : new LinkedHashMap<>();
    }

    public String getId() { return id; }
    public String getTraceId() { return traceId; }
    public String getSpanId() { return spanId; }
    public String getParentSpanId() { return parentSpanId; }
    public String getAgent() { return agent; }
    public String getAction() { return action; }
    public long getStartTime() { return startTime; }
    public Long getEndTime() { return endTime; }
    public Long getDurationMs() { return durationMs; }
    public String getStatus() { return status; }
    public Map<String, Object> getAttributes() { return attributes; }

    public void setEndTime(Long endTime) { this.endTime = endTime; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public void setStatus(String status) { this.status = status; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
}

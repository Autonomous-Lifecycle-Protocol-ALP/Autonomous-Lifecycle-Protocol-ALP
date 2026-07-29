package com.alp.sdk;

import java.util.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class TelemetryEngine {
    private final Map<String, Span> activeSpans = new LinkedHashMap<>();
    private final List<Span> completedSpans = new ArrayList<>();

    public String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public String generateSpanId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public Span startSpan(String action, java.util.Map<String, Object> opts) {
        String traceId = (String) opts.getOrDefault("traceId", generateTraceId());
        String spanId = (String) opts.getOrDefault("spanId", generateSpanId());
        String parentSpanId = (String) opts.get("parentSpanId");
        String agent = (String) opts.get("agent");
        Map<String, Object> attributes = (Map<String, Object>) opts.getOrDefault("attributes", new LinkedHashMap<>());

        Span span = new Span("span-" + spanId, traceId, spanId, parentSpanId, agent, action, System.currentTimeMillis(), "UNSET", new LinkedHashMap<>(attributes));
        activeSpans.put(spanId, span);
        return span;
    }

    public Span startSpan(String action) {
        return startSpan(action, new LinkedHashMap<>());
    }

    public Span endSpan(String spanId, String status, Map<String, Object> attributes) {
        Span span = activeSpans.get(spanId);
        if (span == null) return null;

        long endTime = System.currentTimeMillis();
        long durationMs = endTime - span.getStartTime();
        span.setEndTime(endTime);
        span.setDurationMs(durationMs);
        span.setStatus(status != null ? status : "OK");
        if (attributes != null) {
            span.setAttributes(new LinkedHashMap<>(span.getAttributes()));
            span.getAttributes().putAll(attributes);
        }

        activeSpans.remove(spanId);
        completedSpans.add(span);
        return span;
    }

    public Span endSpan(String spanId) {
        return endSpan(spanId, "OK", null);
    }

    public String injectContext(Span span) {
        return "00-" + span.getTraceId() + "-" + span.getSpanId() + "-01";
    }

    public Map<String, String> extractContext(String traceparent) {
        String[] parts = traceparent.split("-");
        if (parts.length < 4 || !"00".equals(parts[0])) return null;
        Map<String, String> result = new LinkedHashMap<>();
        result.put("traceId", parts[1]);
        result.put("parentSpanId", parts[2]);
        return result;
    }

    public Map<String, Object> exportOTLP() {
        List<Map<String, Object>> scopeSpans = new ArrayList<>();
        Map<String, Object> scope = new LinkedHashMap<>();
        scope.put("name", "@autonomous-lifecycle-protocol-alp/telemetry");
        scope.put("version", "17.0.0");

        List<Map<String, Object>> spans = new ArrayList<>();
        for (Span s : completedSpans) {
            Map<String, Object> spanMap = new LinkedHashMap<>();
            spanMap.put("traceId", s.getTraceId());
            spanMap.put("spanId", s.getSpanId());
            spanMap.put("parentSpanId", s.getParentSpanId() != null ? s.getParentSpanId() : "");
            spanMap.put("name", s.getAction());
            spanMap.put("kind", 1);
            spanMap.put("startTimeUnixNano", String.valueOf(s.getStartTime() * 1000000));
            long endTime = s.getEndTime() != null ? s.getEndTime() : s.getStartTime();
            spanMap.put("endTimeUnixNano", String.valueOf(endTime * 1000000));

            int statusCode = 0;
            if ("OK".equals(s.getStatus())) statusCode = 1;
            else if ("ERROR".equals(s.getStatus())) statusCode = 2;
            Map<String, Object> statusMap = new LinkedHashMap<>();
            statusMap.put("code", statusCode);
            spanMap.put("status", statusMap);

            List<Map<String, Object>> attrs = new ArrayList<>();
            for (Map.Entry<String, Object> entry : s.getAttributes().entrySet()) {
                Map<String, Object> attr = new LinkedHashMap<>();
                Map<String, Object> value = new LinkedHashMap<>();
                value.put("stringValue", String.valueOf(entry.getValue()));
                attr.put("key", entry.getKey());
                attr.put("value", value);
                attrs.add(attr);
            }
            spanMap.put("attributes", attrs);
            spans.add(spanMap);
        }
        scope.put("spans", spans);
        Map<String, Object> scopeSpan = new LinkedHashMap<>();
        scopeSpan.put("scope", scope);
        scopeSpan.put("spans", spans);
        scopeSpans.add(scopeSpan);

        Map<String, Object> resource = new LinkedHashMap<>();
        List<Map<String, Object>> resourceAttrs = new ArrayList<>();
        Map<String, Object> svcName = new LinkedHashMap<>();
        Map<String, Object> svcValue = new LinkedHashMap<>();
        svcValue.put("stringValue", "alp-execution-engine");
        svcName.put("key", "service.name");
        svcName.put("value", svcValue);
        resourceAttrs.add(svcName);

        Map<String, Object> sdkName = new LinkedHashMap<>();
        Map<String, Object> sdkValue = new LinkedHashMap<>();
        sdkValue.put("stringValue", "alp-telemetry");
        sdkName.put("key", "telemetry.sdk.name");
        sdkName.put("value", sdkValue);
        resourceAttrs.add(sdkName);
        resource.put("attributes", resourceAttrs);

        Map<String, Object> resourceSpans = new LinkedHashMap<>();
        resourceSpans.put("resource", resource);
        resourceSpans.put("scopeSpans", scopeSpans);

        List<Map<String, Object>> resourceSpansList = new ArrayList<>();
        resourceSpansList.add(resourceSpans);

        Map<String, Object> otlp = new LinkedHashMap<>();
        otlp.put("resourceSpans", resourceSpansList);
        return otlp;
    }

    public Map<String, Integer> getTraceSummary() {
        int okCount = 0;
        int errorCount = 0;
        for (Span s : completedSpans) {
            if ("OK".equals(s.getStatus())) okCount++;
            else if ("ERROR".equals(s.getStatus())) errorCount++;
        }
        Map<String, Integer> summary = new LinkedHashMap<>();
        summary.put("totalSpans", completedSpans.size() + activeSpans.size());
        summary.put("activeSpans", activeSpans.size());
        summary.put("okCount", okCount);
        summary.put("errorCount", errorCount);
        return summary;
    }

    public List<Span> getCompletedSpans() {
        return new ArrayList<>(completedSpans);
    }
}

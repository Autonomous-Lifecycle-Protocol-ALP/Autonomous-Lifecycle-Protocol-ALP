package com.alp.sdk;

import java.util.*;

public class TelemetryEngineTest {
    public static void main(String[] args) {
        TelemetryEngine telemetry = new TelemetryEngine();
        Span span = telemetry.startSpan("test-action", new java.util.HashMap<>());
        span.getAttributes().put("key", "value");
        telemetry.endSpan(span.getSpanId(), "OK", null);

        Map<String, Integer> summary = telemetry.getTraceSummary();
        System.out.println("Summary: " + summary);

        String traceparent = telemetry.injectContext(span);
        System.out.println("Traceparent: " + traceparent);

        Map<String, String> extracted = telemetry.extractContext(traceparent);
        System.out.println("Extracted: " + extracted);

        Map<String, Object> otlp = telemetry.exportOTLP();
        System.out.println("OTLP exported: " + otlp.containsKey("resourceSpans"));
    }
}

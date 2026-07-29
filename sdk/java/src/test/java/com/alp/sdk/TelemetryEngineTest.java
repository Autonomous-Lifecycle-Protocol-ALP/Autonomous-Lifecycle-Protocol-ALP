package com.alp.sdk;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class TelemetryEngineTest {
    private TelemetryEngine telemetry;

    @BeforeEach
    public void setUp() {
        telemetry = new TelemetryEngine();
    }

    @Test
    public void testStartAndEndSpan() {
        Map<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("key", "value");
        Span span = telemetry.startSpan("test-action", attrs);
        telemetry.endSpan(span.getSpanId(), "OK", null);

        Map<String, Integer> summary = telemetry.getTraceSummary();
        assertEquals(1, summary.get("totalSpans").intValue());
        assertEquals(1, summary.get("okCount").intValue());
    }

    @Test
    public void testInjectExtractContext() {
        Map<String, Object> attrs = new LinkedHashMap<>();
        Span span = telemetry.startSpan("test-action", attrs);
        String traceparent = telemetry.injectContext(span);

        Map<String, String> extracted = telemetry.extractContext(traceparent);
        assertNotNull(extracted);
        assertEquals(span.getTraceId(), extracted.get("traceId"));
        assertEquals(span.getSpanId(), extracted.get("parentSpanId"));
    }

    @Test
    public void testExportOTLP() {
        Map<String, Object> attrs = new LinkedHashMap<>();
        Span span = telemetry.startSpan("test-action", attrs);
        telemetry.endSpan(span.getSpanId(), "OK", null);

        Map<String, Object> otlp = telemetry.exportOTLP();
        assertTrue(otlp.containsKey("resourceSpans"));
    }
}

package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class PredictivePolicyEngineTest {

    private List<AlpObject> objects() {
        AlpObject p1 = new AlpObject("p-strict", "policy");
        p1.setProperty("allow_commands", Arrays.asList("run"));
        p1.setProperty("deny_commands", Arrays.asList("rm"));
        p1.setProperty("enforcement", "strict");
        AlpObject p2 = new AlpObject("p-warn", "policy");
        p2.setProperty("allow_commands", Arrays.asList("run"));
        p2.setProperty("deny_commands", Arrays.asList("rm"));
        p2.setProperty("enforcement", "warn");
        return Arrays.asList(p1, p2);
    }

    @Test
    void noEventStore_doesNotCrash() {
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        PolicyDecision decision = engine.evaluate(new PolicyQuery("command", "run"));
        assertNotNull(decision.getAudit());
        assertTrue(decision.getAudit().containsKey("anomaly"));
    }

    @Test
    void attachesAnomalyToDecision() {
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        PolicyDecision decision = engine.evaluate(new PolicyQuery("command", "run"));
        Map<String, Object> anomaly = (Map<String, Object>) decision.getAudit().get("anomaly");
        assertNotNull(anomaly);
        assertTrue(anomaly.containsKey("score"));
        assertTrue(anomaly.containsKey("factors"));
        assertTrue(anomaly.containsKey("recommendation"));
    }

    @Test
    void denyOnly_attachesAnomaly() {
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        PolicyDecision decision = engine.evaluateDenyOnly(new PolicyQuery("command", "rm"));
        Map<String, Object> anomaly = (Map<String, Object>) decision.getAudit().get("anomaly");
        assertNotNull(anomaly);
        assertTrue(anomaly.containsKey("score"));
    }

    @Test
    void proposal_attachesNeutralAnomaly() {
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        PolicyDecision decision = engine.evaluateProposal("noop");
        Map<String, Object> anomaly = (Map<String, Object>) decision.getAudit().get("anomaly");
        assertEquals(0.0, ((Number) anomaly.get("score")).doubleValue());
    }

    @Test
    void learnsBaselinesFromEventStore() {
        List<Event> events = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("kind", "command");
            payload.put("value", "run");
            payload.put("status", i % 2 != 0 ? "[x]" : "[!]");
            payload.put("blocked", i % 2 == 0);
            events.add(new Event(payload, "2026-01-01T00:00:00Z"));
        }
        EventStore store = new EventStore("/tmp/test", "1.0");
        // manually seed events via learnFromEvents for simplicity
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        engine.learnFromEvents(events);
        List<PredictivePolicyEngine.BaselineProfile> baselines = engine.getBaselines();
        assertEquals(1, baselines.size());
        assertEquals("command", baselines.get(0).getKind());
        assertEquals("run", baselines.get(0).getValue());
        assertEquals(20, baselines.get(0).getSampleCount());
    }

    @Test
    void highFailureRate_increasesAnomalyScore() {
        List<Event> events = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("kind", "command");
            payload.put("value", "run");
            payload.put("status", "[!]");
            payload.put("blocked", true);
            events.add(new Event(payload, "2026-01-01T00:00:00Z"));
        }
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        engine.learnFromEvents(events);
        PolicyDecision decision = engine.evaluate(new PolicyQuery("command", "run"));
        Map<String, Object> anomaly = (Map<String, Object>) decision.getAudit().get("anomaly");
        List<String> factors = (List<String>) anomaly.get("factors");
        assertTrue(factors.contains("high_failure_rate"));
    }

    @Test
    void history_recordsEvaluations() {
        PredictivePolicyEngine engine = new PredictivePolicyEngine(objects());
        engine.evaluate(new PolicyQuery("command", "run"));
        engine.evaluate(new PolicyQuery("command", "run"));
        assertEquals(2, engine.getHistory().size());
    }

    @SafeVarargs
    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put((String) kv[i], (Object) kv[i + 1]);
        }
        return map;
    }
}

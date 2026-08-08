package com.alp.sdk;

import com.alp.sdk.healing.CircuitBreaker;
import com.alp.sdk.healing.HealingAction;
import com.alp.sdk.healing.HealingContext;
import com.alp.sdk.healing.HealingEngine;
import com.alp.sdk.healing.HealingReport;
import com.alp.sdk.healing.HealingStrategy;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class HealingEngineTest {

    @Test
    void strategyValues() {
        assertEquals("retry", HealingStrategy.RETRY.getValue());
        assertEquals("skip", HealingStrategy.SKIP.getValue());
        assertEquals("rollback", HealingStrategy.ROLLBACK.getValue());
        assertEquals("escalate", HealingStrategy.ESCALATE.getValue());
    }

    @Test
    void actionToMap() {
        HealingAction action = new HealingAction(HealingStrategy.RETRY, "t1", "wf1", 2, "Retry succeeded", true, "2026-01-01T00:00:00Z", Map.of("key", "val"));
        Map<String, Object> d = actionToMap(action);
        assertEquals("retry", d.get("strategy"));
        assertEquals("t1", d.get("task_id"));
        assertEquals(2, d.get("attempt"));
        assertEquals(true, d.get("succeeded"));
    }

    @Test
    void reportAddActionAndSummary() {
        HealingReport report = new HealingReport("wf1");
        report.addAction(new HealingAction(HealingStrategy.RETRY, "t1", "wf1", 1, "ok", true, "2026-01-01T00:00:00Z", Map.of()));
        report.addAction(new HealingAction(HealingStrategy.SKIP, "t2", "wf1", 1, "skipped", true, "2026-01-01T00:00:00Z", Map.of()));
        report.setFinishedAt("2026-01-01T00:00:01Z");
        Map<String, Object> d = report.toMap();
        assertEquals(2, d.get("total_actions"));
        assertEquals(2, d.get("succeeded"));
        assertEquals(0, d.get("failed"));
        String s = report.summary();
        assertTrue(s.contains("wf1"));
        assertTrue(s.contains("actions=2"));
    }

    @Test
    void reportEmpty() {
        HealingReport report = new HealingReport("wf1");
        Map<String, Object> d = report.toMap();
        assertEquals(0, d.get("total_actions"));
        assertEquals(0, d.get("succeeded"));
        assertEquals(0, d.get("failed"));
    }

    @Test
    void circuitBreakerClosedInitially() {
        CircuitBreaker cb = new CircuitBreaker(2, 3_600_000_000_000L);
        assertFalse(cb.isOpen("t1"));
    }

    @Test
    void circuitBreakerOpensAfterThreshold() {
        CircuitBreaker cb = new CircuitBreaker(2, 3_600_000_000_000L);
        cb.recordFailure("t1");
        assertFalse(cb.isOpen("t1"));
        cb.recordFailure("t1");
        assertTrue(cb.isOpen("t1"));
    }

    @Test
    void circuitBreakerSuccessResets() {
        CircuitBreaker cb = new CircuitBreaker(2, 3_600_000_000_000L);
        cb.recordFailure("t1");
        cb.recordSuccess("t1");
        assertFalse(cb.isOpen("t1"));
    }

    @Test
    void circuitBreakerResetClears() {
        CircuitBreaker cb = new CircuitBreaker(2, 3_600_000_000_000L);
        cb.recordFailure("t1");
        cb.recordFailure("t1");
        assertTrue(cb.isOpen("t1"));
        cb.reset("t1");
        assertFalse(cb.isOpen("t1"));
    }

    @Test
    void circuitBreakerRecoveryTimeout() throws InterruptedException {
        CircuitBreaker cb = new CircuitBreaker(2, 10_000_000L);
        cb.recordFailure("t1");
        cb.recordFailure("t1");
        assertTrue(cb.isOpen("t1"));
        Thread.sleep(20);
        assertFalse(cb.isOpen("t1"));
    }

    @Test
    void retrySucceeds() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 2, HealingStrategy.RETRY);
        HealingContext[] ctxHolder = new HealingContext[1];
        HealingReport report = engine.heal("t1", "transient", 1, ctx -> { ctxHolder[0] = ctx; return; }, "", null);
        assertEquals(1, report.getActions().size());
        assertEquals(HealingStrategy.RETRY, report.getActions().get(0).getStrategy());
        assertTrue(report.getActions().get(0).isSucceeded());
        assertEquals("Retry succeeded", report.getActions().get(0).getReason());
        assertEquals("t1", ctxHolder[0].getTaskId());
    }

    @Test
    void retryFailsEscalates() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 2, HealingStrategy.RETRY);
        engine.heal("t1", "always fails", 1, ctx -> { return; }, "", null);
        HealingReport report = engine.heal("t1", "always fails", 2, ctx -> { return; }, "", null);
        assertEquals(2, report.getActions().size());
        assertEquals(HealingStrategy.ESCALATE, report.getActions().get(1).getStrategy());
        assertFalse(report.getActions().get(1).isSucceeded());
        assertTrue(report.getActions().get(1).getReason().contains("max attempts"));
    }

    @Test
    void skipNonRetryable() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 2, HealingStrategy.RETRY);
        HealingReport report = engine.heal("t1", "cannot retry: bad input", 1, ctx -> { return; }, "", null);
        assertEquals(HealingStrategy.SKIP, report.getActions().get(0).getStrategy());
        assertTrue(report.getActions().get(0).isSucceeded());
        assertTrue(report.getActions().get(0).getReason().contains("Skipped"));
    }

    @Test
    void circuitBreakerTriggersEscalate() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        CircuitBreaker cb = new CircuitBreaker(1, 3_600_000_000_000L);
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, cb, 5, HealingStrategy.RETRY);
        engine.heal("t1", "fail", 1, ctx -> { throw new RuntimeException("fail"); }, "", null);
        HealingReport report = engine.heal("t1", "fail", 2, ctx -> { return; }, "", null);
        assertEquals(HealingStrategy.ESCALATE, report.getActions().get(1).getStrategy());
        assertTrue(report.getActions().get(1).getReason().contains("circuit breaker"));
    }

    @Test
    void rollbackWhenCheckpointPresent() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 3, HealingStrategy.RETRY);
        engine.heal("t1", "fail", 1, ctx -> { throw new RuntimeException("fail"); }, "", Map.of("checkpoint", true));
        HealingReport report = engine.heal("t1", "fail", 2, ctx -> { return; }, "", Map.of("checkpoint", true));
        assertEquals(HealingStrategy.RETRY, report.getActions().get(0).getStrategy());
        assertFalse(report.getActions().get(0).isSucceeded());
        assertEquals(HealingStrategy.ROLLBACK, report.getActions().get(1).getStrategy());
        assertTrue(report.getActions().get(1).isSucceeded());
    }

    @Test
    void persistsActionsToFile() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 2, HealingStrategy.RETRY);
        engine.heal("t1", "fail", 1, ctx -> { throw new RuntimeException("fail"); }, "", null);
        java.nio.file.Path path = tmpdir.resolve(".healing").resolve("healing.jsonl");
        assertTrue(Files.exists(path));
        List<String> lines = Files.readAllLines(path);
        assertEquals(1, lines.size());
        Map<String, Object> m = new com.fasterxml.jackson.databind.ObjectMapper().readValue(lines.get(0), Map.class);
        assertEquals("t1", m.get("task_id"));
        assertEquals("retry", m.get("strategy"));
    }

    @Test
    void getReport() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 2, HealingStrategy.RETRY);
        assertNull(engine.getReport("nonexistent"));
        engine.heal("t1", "fail", 1, ctx -> { return; }, "", null);
        HealingReport fetched = engine.getReport("_global");
        assertNotNull(fetched);
        assertEquals(1, fetched.getActions().size());
    }

    @Test
    void readPastActionsFilters() throws Exception {
        java.nio.file.Path tmpdir = Files.createTempDirectory("healing-test");
        HealingEngine engine = new HealingEngine(tmpdir.toString(), null, null, 2, HealingStrategy.RETRY);
        engine.heal("t1", "fail", 1, ctx -> { return; }, "wf1", null);
        engine.heal("t2", "fail", 1, ctx -> { return; }, "wf2", null);
        List<Map<String, Object>> actions = engine.readPastActions("wf1");
        assertEquals(1, actions.size());
        assertEquals("t1", actions.get(0).get("task_id"));
        List<Map<String, Object>> all = engine.readPastActions("");
        assertEquals(2, all.size());
    }

    private static Map<String, Object> actionToMap(HealingAction action) {
        return Map.of(
                "strategy", action.getStrategy().getValue(),
                "task_id", action.getTaskId(),
                "workflow_id", action.getWorkflowId(),
                "attempt", action.getAttempt(),
                "reason", action.getReason(),
                "succeeded", action.isSucceeded(),
                "timestamp", action.getTimestamp(),
                "metadata", action.getMetadata()
        );
    }
}

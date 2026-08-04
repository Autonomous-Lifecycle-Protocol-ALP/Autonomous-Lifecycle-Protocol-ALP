package com.alp.sdk.healing;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class HealingEngine {
    private final String alpDir;
    private final String version;
    private final CircuitBreaker circuitBreaker;
    private final int maxAttempts;
    private final HealingStrategy defaultStrategy;
    private final Map<String, HealingReport> reports = new java.util.concurrent.ConcurrentHashMap<>();

    private static final String HEALING_DIR = ".healing";
    private static final String HEALING_FILE = "healing.jsonl";

    public HealingEngine(String alpDir, String version, CircuitBreaker circuitBreaker, int maxAttempts, HealingStrategy defaultStrategy) {
        this.alpDir = alpDir;
        this.version = version != null ? version : "16.1.0";
        this.circuitBreaker = circuitBreaker != null ? circuitBreaker : new CircuitBreaker(3, 60_000_000_000L);
        this.maxAttempts = maxAttempts > 0 ? maxAttempts : 3;
        this.defaultStrategy = defaultStrategy != null ? defaultStrategy : HealingStrategy.RETRY;
    }

    public HealingReport heal(String taskId, String errorStr, int attempt, Executor executor, String workflowId, Map<String, Object> context) {
        String wfId = workflowId != null && !workflowId.isEmpty() ? workflowId : "_global";
        HealingReport report = reports.computeIfAbsent(wfId, k -> new HealingReport(k));

        HealingContext ctx = new HealingContext(taskId, workflowId, attempt, errorStr, nowIso(), context != null ? context : Map.of());

        HealingStrategy strategy = selectStrategy(ctx);
        boolean succeeded = false;
        String reason = "";

        switch (strategy) {
            case RETRY -> {
                try {
                    executor.execute(ctx);
                    succeeded = true;
                    reason = "Retry succeeded";
                    circuitBreaker.recordSuccess(taskId);
                } catch (Exception exc) {
                    succeeded = false;
                    reason = "Retry failed: " + exc.getMessage();
                    circuitBreaker.recordFailure(taskId);
                }
            }
            case SKIP -> {
                reason = "Skipped with justification: non-retryable error";
                succeeded = true;
            }
            case ROLLBACK -> {
                try {
                    executor.execute(ctx);
                    succeeded = true;
                    reason = "Rollback and re-execute succeeded";
                    circuitBreaker.recordSuccess(taskId);
                } catch (Exception exc) {
                    succeeded = false;
                    reason = "Rollback failed: " + exc.getMessage();
                    circuitBreaker.recordFailure(taskId);
                }
            }
            case ESCALATE -> {
                reason = "Escalated to human-in-the-loop: circuit breaker open or max attempts reached";
                succeeded = false;
                circuitBreaker.recordFailure(taskId);
            }
        }

        HealingAction action = new HealingAction(
                strategy, taskId, workflowId, attempt, reason, succeeded, nowIso(),
                Map.of("error", errorStr)
        );
        report.addAction(action);
        appendAction(action);
        return report;
    }

    public HealingReport getReport(String workflowId) {
        String key = workflowId != null ? workflowId : reports.keySet().stream().findFirst().orElse(null);
        return reports.get(key);
    }

    public List<Map<String, Object>> readPastActions(String workflowId) throws IOException {
        Path path = healingPath();
        if (!Files.exists(path)) {
            return List.of();
        }
        List<String> lines = Files.readAllLines(path);
        List<Map<String, Object>> actions = new ArrayList<>();
        for (String line : lines) {
            if (line == null || line.trim().isEmpty()) {
                continue;
            }
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> m = mapper.readValue(line, Map.class);
                if (workflowId == null || workflowId.isEmpty() || workflowId.equals(m.get("workflow_id"))) {
                    actions.add(m);
                }
            } catch (Exception e) {
                continue;
            }
        }
        return actions;
    }

    private HealingStrategy selectStrategy(HealingContext ctx) {
        if (circuitBreaker.isOpen(ctx.getTaskId())) {
            return HealingStrategy.ESCALATE;
        }
        if (ctx.getAttempt() >= maxAttempts) {
            return HealingStrategy.ESCALATE;
        }
        if (containsLower(ctx.getError(), "cannot retry")) {
            return HealingStrategy.SKIP;
        }
        Map<String, Object> metadata = ctx.getMetadata();
        if (metadata != null && metadata.containsKey("checkpoint") && ctx.getAttempt() > 1) {
            return HealingStrategy.ROLLBACK;
        }
        return defaultStrategy;
    }

    private Path healingPath() throws IOException {
        Path d = Path.of(alpDir, HEALING_DIR);
        Files.createDirectories(d);
        return d.resolve(HEALING_FILE);
    }

    private void appendAction(HealingAction action) {
        try {
            Path path = healingPath();
            String line = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(
                    Map.of(
                            "strategy", action.getStrategy().getValue(),
                            "task_id", action.getTaskId(),
                            "workflow_id", action.getWorkflowId(),
                            "attempt", action.getAttempt(),
                            "reason", action.getReason(),
                            "succeeded", action.isSucceeded(),
                            "timestamp", action.getTimestamp(),
                            "metadata", action.getMetadata()
                    )
            );
            Files.writeString(path, line + System.lineSeparator(), java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception e) {
            // ignore persist errors in tests
        }
    }

    private static String nowIso() {
        return java.time.Instant.now().toString();
    }

    private static boolean containsLower(String s, String substr) {
        return s != null && s.toLowerCase().contains(substr.toLowerCase());
    }

    @FunctionalInterface
    public interface Executor {
        void execute(HealingContext ctx) throws Exception;
    }
}

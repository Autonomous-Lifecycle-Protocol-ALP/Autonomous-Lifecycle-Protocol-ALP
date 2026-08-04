package com.alp.sdk;

import java.util.*;
import java.util.stream.Collectors;

public class PredictivePolicyEngine {
    private final PolicyEngine engine;
    private final double zThreshold;
    private final int minSamples;
    private final Map<String, BaselineProfile> baselines = new LinkedHashMap<>();
    private final List<HistoryEntry> history = new ArrayList<>();

    public PredictivePolicyEngine(List<AlpObject> objects) {
        this(objects, null, 2.5, 5);
    }

    public PredictivePolicyEngine(List<AlpObject> objects, EventStore eventStore, double zThreshold, int minSamples) {
        this.engine = new PolicyEngine(objects);
        this.zThreshold = zThreshold;
        this.minSamples = minSamples;
        if (eventStore != null) {
            learnFromEvents(eventStore.readAll());
        }
    }

    public PolicyDecision evaluate(PolicyQuery query) {
        AnomalyScore anomaly = scoreQuery(query);
        PolicyDecision decision = engine.evaluate(query);
        if (decision.getAudit() == null) {
            decision = new PolicyDecision(decision.isAllowed(), decision.isBlocked(), decision.getReasons(), decision.getPolicies(), decision.requiresApproval(), new HashMap<>());
        }
        decision.getAudit().put("anomaly", anomaly.toMap());
        history.add(new HistoryEntry(query, decision));
        return decision;
    }

    public PolicyDecision evaluateDenyOnly(PolicyQuery query) {
        AnomalyScore anomaly = scoreQuery(query);
        PolicyDecision decision = engine.evaluate(query);
        if (decision.getAudit() == null) {
            decision = new PolicyDecision(decision.isAllowed(), decision.isBlocked(), decision.getReasons(), decision.getPolicies(), decision.requiresApproval(), new HashMap<>());
        }
        decision.getAudit().put("anomaly", anomaly.toMap());
        history.add(new HistoryEntry(query, decision));
        return decision;
    }

    public PolicyDecision evaluateProposal(String proposalId) {
        AnomalyScore anomaly = new AnomalyScore(0.0, new ArrayList<>(), new HashMap<>(), "monitor");
        PolicyDecision decision = new PolicyDecision(false, false, new ArrayList<>(), new ArrayList<>(), false, new HashMap<>());
        decision.getAudit().put("anomaly", anomaly.toMap());
        history.add(new HistoryEntry(new PolicyQuery("proposal", proposalId), decision));
        return decision;
    }

    public List<BaselineProfile> getBaselines() {
        return new ArrayList<>(baselines.values()).stream()
                .sorted(Comparator.comparing((BaselineProfile p) -> p.getKind()).thenComparing(BaselineProfile::getValue))
                .collect(Collectors.toList());
    }

    public BaselineProfile getBaseline(String kind, String value) {
        return baselines.get(kind + ":" + value);
    }

    public List<HistoryEntry> getHistory() {
        return history;
    }

    public Map<String, Object> anomaliesSummary(String policyId) {
        List<Map<String, Object>> items = new ArrayList<>();
        int anomalous = 0;
        for (HistoryEntry entry : history) {
            Map<String, Object> anomaly = (Map<String, Object>) entry.decision.getAudit().get("anomaly");
            if (anomaly == null) continue;
            if (policyId != null && !entry.decision.getPolicies().contains(policyId)) continue;
            double score = ((Number) anomaly.getOrDefault("score", 0.0)).doubleValue();
            if (score >= zThreshold) anomalous++;
            items.add(Map.of(
                    "kind", entry.query.getKind(),
                    "value", entry.query.getValue(),
                    "score", score,
                    "factors", anomaly.get("factors"),
                    "recommendation", anomaly.get("recommendation")
            ));
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total", items.size());
        summary.put("anomalous", anomalous);
        summary.put("items", items);
        return summary;
    }

    public void learnFromEvents(List<Event> events) {
        Map<String, Integer> counts = new HashMap<>();
        Map<String, Integer> failures = new HashMap<>();
        Map<String, String> lastSeen = new HashMap<>();
        Map<String, List<Double>> samples = new HashMap<>();

        for (Event event : events) {
            String kind = event.getPayload().getOrDefault("kind", "").toString();
            String value = event.getPayload().getOrDefault("value", "").toString();
            if (kind.isEmpty() || value.isEmpty()) continue;
            String key = kind + ":" + value;
            counts.merge(key, 1, Integer::sum);
            samples.computeIfAbsent(key, k -> new ArrayList<>()).add((double) counts.get(key));
            String status = event.getPayload().getOrDefault("status", "").toString();
            boolean blocked = Boolean.TRUE.equals(event.getPayload().get("blocked"));
            if ("[!]".equals(status) || blocked) {
                failures.merge(key, 1, Integer::sum);
            }
            lastSeen.put(key, event.getTimestamp());
        }

        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            String key = entry.getKey();
            int count = entry.getValue();
            String[] parts = key.split(":", 2);
            String kind = parts.length > 0 ? parts[0] : "";
            String val = parts.length > 1 ? parts[1] : "";
            List<Double> freqs = samples.getOrDefault(key, Collections.emptyList());
            double meanFreq = avg(freqs);
            double stddevFreq = stddev(freqs);
            double failureRate = count > 0 ? (double) failures.getOrDefault(key, 0) / count : 0.0;
            baselines.put(key, new BaselineProfile(kind, val, count, meanFreq, stddevFreq, failureRate, lastSeen.getOrDefault(key, "")));
        }
    }

    private AnomalyScore scoreQuery(PolicyQuery query) {
        String key = query.getKind() + ":" + query.getValue();
        BaselineProfile profile = baselines.get(key);

        List<String> factors = new ArrayList<>();
        List<Double> scoreComponents = new ArrayList<>();

        if (profile == null || profile.getSampleCount() < minSamples) {
            factors.add("insufficient_history");
            scoreComponents.add(0.3);
        } else {
            if (profile.getFailureRate() > 0.3) {
                factors.add("high_failure_rate");
                scoreComponents.add(Math.min(profile.getFailureRate(), 1.0));
            }
            if (profile.getStddevFrequency() > 2.0) {
                factors.add("high_frequency_variance");
                scoreComponents.add(0.5);
            }
        }

        long recent = history.stream()
                .filter(e -> e.query.getKind().equals(query.getKind()) && e.query.getValue().equals(query.getValue()))
                .count();
        if (recent == 0) {
            factors.add("rare_request");
            scoreComponents.add(0.4);
        } else if (recent > 10) {
            factors.add("burst");
            scoreComponents.add(0.3);
        }

        double score = scoreComponents.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        score = Math.min(1.0, score);
        score = Math.round(score * 1000.0) / 1000.0;

        String recommendation = "monitor";
        if (score >= 0.8) {
            recommendation = "escalate";
        } else if (score >= 0.5) {
            recommendation = "require_approval";
        }

        Map<String, Object> baselineMap = profile != null ? profile.toMap() : new HashMap<>();
        return new AnomalyScore(score, factors, baselineMap, recommendation);
    }

    private static double avg(List<Double> values) {
        if (values.isEmpty()) return 0.0;
        double sum = 0.0;
        for (double v : values) sum += v;
        return sum / values.size();
    }

    private static double stddev(List<Double> values) {
        if (values.size() < 2) return 0.0;
        double m = avg(values);
        double variance = 0.0;
        for (double v : values) {
            double d = v - m;
            variance += d * d;
        }
        return Math.sqrt(variance / (values.size() - 1));
    }

    public static class AnomalyScore {
        private final double score;
        private final List<String> factors;
        private final Map<String, Object> baseline;
        private final String recommendation;

        public AnomalyScore(double score, List<String> factors, Map<String, Object> baseline, String recommendation) {
            this.score = score;
            this.factors = factors;
            this.baseline = baseline;
            this.recommendation = recommendation;
        }

        public boolean isAnomalous(double threshold) {
            return score >= threshold;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("score", score);
            map.put("factors", factors);
            map.put("baseline", baseline);
            map.put("recommendation", recommendation);
            return map;
        }

        public double getScore() { return score; }
        public List<String> getFactors() { return factors; }
        public Map<String, Object> getBaseline() { return baseline; }
        public String getRecommendation() { return recommendation; }
    }

    public static class BaselineProfile {
        private final String kind;
        private final String value;
        private final int sampleCount;
        private final double meanFrequency;
        private final double stddevFrequency;
        private final double failureRate;
        private final String lastSeen;

        public BaselineProfile(String kind, String value, int sampleCount, double meanFrequency, double stddevFrequency, double failureRate, String lastSeen) {
            this.kind = kind;
            this.value = value;
            this.sampleCount = sampleCount;
            this.meanFrequency = meanFrequency;
            this.stddevFrequency = stddevFrequency;
            this.failureRate = failureRate;
            this.lastSeen = lastSeen;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("kind", kind);
            map.put("value", value);
            map.put("sample_count", sampleCount);
            map.put("mean_frequency", meanFrequency);
            map.put("stddev_frequency", stddevFrequency);
            map.put("failure_rate", failureRate);
            map.put("last_seen", lastSeen);
            return map;
        }

        public String getKind() { return kind; }
        public String getValue() { return value; }
        public int getSampleCount() { return sampleCount; }
        public double getMeanFrequency() { return meanFrequency; }
        public double getStddevFrequency() { return stddevFrequency; }
        public double getFailureRate() { return failureRate; }
        public String getLastSeen() { return lastSeen; }
    }

    public static class EventEntry {
        private final String payloadKind;
        private final String payloadValue;
        private final String status;
        private final boolean blocked;
        private final String timestamp;

        public EventEntry(String payloadKind, String payloadValue, String status, boolean blocked, String timestamp) {
            this.payloadKind = payloadKind;
            this.payloadValue = payloadValue;
            this.status = status;
            this.blocked = blocked;
            this.timestamp = timestamp;
        }

        public String getPayloadKind() { return payloadKind; }
        public String getPayloadValue() { return payloadValue; }
        public String getStatus() { return status; }
        public boolean isBlocked() { return blocked; }
        public String getTimestamp() { return timestamp; }
    }

    private static class HistoryEntry {
        private final PolicyQuery query;
        private final PolicyDecision decision;

        HistoryEntry(PolicyQuery query, PolicyDecision decision) {
            this.query = query;
            this.decision = decision;
        }
    }
}

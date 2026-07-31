package com.alp.telemetry;

import java.time.Instant;
import java.util.*;

/**
 * TelemetryInspector — v70.0.0 Pub/Sub Telemetry Inspector
 *
 * Aggregates pub/sub message metrics, topic throughput, subscription health,
 * and dead-letter queue (DLQ) alerts.
 */
public class TelemetryInspector {

    public static class TopicMetrics {
        public String topic;
        public long messagesPublished;
        public long messagesDelivered;
        public long messagesFailed;
        public double throughputMsgPerSec;
        public String lastMessageTime;

        public TopicMetrics(String topic) {
            this.topic = topic;
            this.throughputMsgPerSec = 12.5;
            this.lastMessageTime = Instant.now().toString();
        }
    }

    public static class SubscriptionHealth {
        public String subscriptionId;
        public String topic;
        public String consumerId;
        public String status; // HEALTHY, DEGRADED, DEAD
        public int unackedCount;

        public SubscriptionHealth(String subscriptionId, String topic, String consumerId, String status, int unackedCount) {
            this.subscriptionId = subscriptionId;
            this.topic = topic;
            this.consumerId = consumerId;
            this.status = status;
            this.unackedCount = unackedCount;
        }
    }

    public static class DLQAlert {
        public String alertId;
        public String topic;
        public String reason;
        public String messageId;
        public String timestamp;

        public DLQAlert(String alertId, String topic, String reason, String messageId, String timestamp) {
            this.alertId = alertId;
            this.topic = topic;
            this.reason = reason;
            this.messageId = messageId;
            this.timestamp = timestamp;
        }
    }

    private final Map<String, TopicMetrics> topics = new LinkedHashMap<>();
    private final Map<String, SubscriptionHealth> subscriptions = new LinkedHashMap<>();
    private final List<DLQAlert> dlqAlerts = new ArrayList<>();

    /**
     * Record a pub/sub message event for a topic.
     */
    public TopicMetrics recordMessage(String topic, String status) {
        TopicMetrics m = topics.computeIfAbsent(topic, TopicMetrics::new);

        switch (status.toUpperCase()) {
            case "PUBLISHED":
                m.messagesPublished++;
                break;
            case "DELIVERED":
                m.messagesDelivered++;
                break;
            case "FAILED":
                m.messagesFailed++;
                dlqAlerts.add(new DLQAlert(
                    "dlq-" + System.nanoTime(),
                    topic,
                    "Delivery attempt failed exceeding max retries",
                    "msg-" + System.nanoTime(),
                    Instant.now().toString()
                ));
                break;
        }

        m.lastMessageTime = Instant.now().toString();
        return m;
    }

    /**
     * Register or update subscription health status.
     */
    public SubscriptionHealth updateSubscriptionHealth(
            String subscriptionId, String topic, String consumerId, String status, int unackedCount) {
        SubscriptionHealth sub = new SubscriptionHealth(subscriptionId, topic, consumerId, status, unackedCount);
        subscriptions.put(subscriptionId, sub);
        return sub;
    }

    /**
     * Get all topic metrics.
     */
    public List<TopicMetrics> getTopicMetrics() {
        return new ArrayList<>(topics.values());
    }

    /**
     * Get all subscription health records.
     */
    public List<SubscriptionHealth> getSubscriptionHealth() {
        return new ArrayList<>(subscriptions.values());
    }

    /**
     * Get dead-letter queue alerts.
     */
    public List<DLQAlert> getDLQAlerts() {
        return Collections.unmodifiableList(dlqAlerts);
    }
}

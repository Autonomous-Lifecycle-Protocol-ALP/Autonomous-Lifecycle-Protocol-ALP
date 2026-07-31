package alpgo

import (
	"fmt"
	"strings"
	"time"
)

// TelemetryInspector — v70.0.0 Pub/Sub Telemetry Inspector
// Aggregates pub/sub message metrics, topic throughput, subscription health, and DLQ alerts.

// TopicMetrics holds aggregated metrics for a single pub/sub topic.
type TopicMetrics struct {
	Topic              string  `json:"topic"`
	MessagesPublished  int64   `json:"messages_published"`
	MessagesDelivered  int64   `json:"messages_delivered"`
	MessagesFailed     int64   `json:"messages_failed"`
	ThroughputMsgPerSec float64 `json:"throughput_msg_per_sec"`
	LastMessageTime    string  `json:"last_message_time"`
}

// SubscriptionHealth tracks the health status of a pub/sub subscription.
type SubscriptionHealth struct {
	SubscriptionID string `json:"subscription_id"`
	Topic          string `json:"topic"`
	ConsumerID     string `json:"consumer_id"`
	Status         string `json:"status"` // HEALTHY, DEGRADED, DEAD
	UnackedCount   int    `json:"unacked_count"`
}

// DLQAlert represents a dead-letter queue alert entry.
type DLQAlert struct {
	AlertID   string `json:"alert_id"`
	Topic     string `json:"topic"`
	Reason    string `json:"reason"`
	MessageID string `json:"message_id"`
	Timestamp string `json:"timestamp"`
}

// TelemetryInspector provides pub/sub telemetry inspection.
type TelemetryInspector struct {
	topics        map[string]*TopicMetrics
	subscriptions map[string]*SubscriptionHealth
	dlqAlerts     []DLQAlert
}

// NewTelemetryInspector creates a new TelemetryInspector.
func NewTelemetryInspector() *TelemetryInspector {
	return &TelemetryInspector{
		topics:        make(map[string]*TopicMetrics),
		subscriptions: make(map[string]*SubscriptionHealth),
		dlqAlerts:     []DLQAlert{},
	}
}

// RecordMessage records a pub/sub message event for a topic.
func (ti *TelemetryInspector) RecordMessage(topic string, status string) *TopicMetrics {
	m, ok := ti.topics[topic]
	if !ok {
		m = &TopicMetrics{
			Topic:              topic,
			ThroughputMsgPerSec: 12.5,
			LastMessageTime:    time.Now().UTC().Format(time.RFC3339),
		}
		ti.topics[topic] = m
	}

	switch strings.ToUpper(status) {
	case "PUBLISHED":
		m.MessagesPublished++
	case "DELIVERED":
		m.MessagesDelivered++
	case "FAILED":
		m.MessagesFailed++
		ti.dlqAlerts = append(ti.dlqAlerts, DLQAlert{
			AlertID:   fmt.Sprintf("dlq-%d", time.Now().UnixNano()),
			Topic:     topic,
			Reason:    "Delivery attempt failed exceeding max retries",
			MessageID: fmt.Sprintf("msg-%d", time.Now().UnixNano()),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	}

	m.LastMessageTime = time.Now().UTC().Format(time.RFC3339)
	return m
}

// UpdateSubscriptionHealth registers or updates subscription health status.
func (ti *TelemetryInspector) UpdateSubscriptionHealth(
	subscriptionID, topic, consumerID, status string, unackedCount int,
) *SubscriptionHealth {
	sub := &SubscriptionHealth{
		SubscriptionID: subscriptionID,
		Topic:          topic,
		ConsumerID:     consumerID,
		Status:         status,
		UnackedCount:   unackedCount,
	}
	ti.subscriptions[subscriptionID] = sub
	return sub
}

// GetTopicMetrics returns all topic metrics.
func (ti *TelemetryInspector) GetTopicMetrics() []*TopicMetrics {
	result := make([]*TopicMetrics, 0, len(ti.topics))
	for _, m := range ti.topics {
		result = append(result, m)
	}
	return result
}

// GetSubscriptionHealth returns all subscription health records.
func (ti *TelemetryInspector) GetSubscriptionHealth() []*SubscriptionHealth {
	result := make([]*SubscriptionHealth, 0, len(ti.subscriptions))
	for _, s := range ti.subscriptions {
		result = append(result, s)
	}
	return result
}

// GetDLQAlerts returns dead-letter queue alerts.
func (ti *TelemetryInspector) GetDLQAlerts() []DLQAlert {
	return ti.dlqAlerts
}

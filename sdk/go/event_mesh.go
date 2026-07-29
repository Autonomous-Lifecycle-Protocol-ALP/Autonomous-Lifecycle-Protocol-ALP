package alpgo

import (
	"fmt"
	"time"
)

type MeshEvent struct {
	ID          string
	Topic       string
	SenderAgent string
	Payload     string
	EventType   string
	Timestamp   string
}

func NewMeshEvent(id, topic, senderAgent, payload string) *MeshEvent {
	return &MeshEvent{
		ID:          id,
		Topic:       topic,
		SenderAgent: senderAgent,
		Payload:     payload,
		EventType:   "state_change",
		Timestamp:   time.Now().Format(time.RFC3339),
	}
}

type EventHandler func(event *MeshEvent)

type EventMeshEngine struct {
	subscriptions map[string][]EventHandler
	eventBuffer   []*MeshEvent
}

func NewEventMeshEngine() *EventMeshEngine {
	return &EventMeshEngine{
		subscriptions: make(map[string][]EventHandler),
		eventBuffer:   []*MeshEvent{},
	}
}

func (e *EventMeshEngine) Subscribe(topic string, handler EventHandler) {
	e.subscriptions[topic] = append(e.subscriptions[topic], handler)
}

func (e *EventMeshEngine) Publish(eventID, topic, senderAgent, payload string) *MeshEvent {
	event := NewMeshEvent(eventID, topic, senderAgent, payload)
	e.eventBuffer = append(e.eventBuffer, event)
	if handlers, ok := e.subscriptions[topic]; ok {
		for _, handler := range handlers {
			handler(event)
		}
	}
	return event
}

func (e *EventMeshEngine) EventBuffer() []*MeshEvent {
	return e.eventBuffer
}

func (e *EventMeshEngine) BufferLen() int {
	return len(e.eventBuffer)
}

func (e *EventMeshEngine) SubscriptionCount(topic string) int {
	return len(e.subscriptions[topic])
}

func init() {
	fmt.Printf("[alpgo] event_mesh initialized\n")
}

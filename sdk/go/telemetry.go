package alpgo

import (
	"fmt"
	"math/rand"
	"time"
)

type Span struct {
	ID          string
	TraceID     string
	SpanID      string
	ParentSpanID string
	Agent       string
	Action      string
	StartTime   int64
	EndTime     *int64
	DurationMs  *int64
	Status      string
	Attributes  map[string]any
}

type TelemetryEngine struct {
	activeSpans  map[string]*Span
	completedSpans []*Span
}

func NewTelemetryEngine() *TelemetryEngine {
	return &TelemetryEngine{
		activeSpans:  make(map[string]*Span),
		completedSpans: []*Span{},
	}
}

func (t *TelemetryEngine) GenerateTraceID() string {
	return fmt.Sprintf("%x", randBytes(16))
}

func (t *TelemetryEngine) GenerateSpanID() string {
	return fmt.Sprintf("%x", randBytes(8))
}

func (t *TelemetryEngine) StartSpan(action string, opts map[string]any) *Span {
	traceID, _ := opts["traceId"].(string)
	spanID, _ := opts["spanId"].(string)
	parentSpanID, _ := opts["parentSpanId"].(string)
	agent, _ := opts["agent"].(string)
	attributes, _ := opts["attributes"].(map[string]any)

	if traceID == "" {
		traceID = t.GenerateTraceID()
	}
	if spanID == "" {
		spanID = t.GenerateSpanID()
	}
	if attributes == nil {
		attributes = make(map[string]any)
	}

	span := &Span{
		ID:       "span-" + spanID,
		TraceID:  traceID,
		SpanID:   spanID,
		Agent:    agent,
		Action:   action,
		StartTime: time.Now().UnixMilli(),
		Status:   "UNSET",
		Attributes: attributes,
	}
	if parentSpanID != "" {
		span.ParentSpanID = parentSpanID
	}

	t.activeSpans[spanID] = span
	return span
}

func (t *TelemetryEngine) StartSpanSimple(action string) *Span {
	return t.StartSpan(action, nil)
}

func (t *TelemetryEngine) EndSpan(spanID string, status string, attributes map[string]any) *Span {
	span, ok := t.activeSpans[spanID]
	if !ok {
		return nil
	}

	endTime := time.Now().UnixMilli()
	duration := endTime - span.StartTime
	span.EndTime = &endTime
	span.DurationMs = &duration
	span.Status = status
	if attributes != nil {
		for k, v := range attributes {
			span.Attributes[k] = v
		}
	}

	delete(t.activeSpans, spanID)
	t.completedSpans = append(t.completedSpans, span)
	return span
}

func (t *TelemetryEngine) EndSpanSimple(spanID string) *Span {
	return t.EndSpan(spanID, "OK", nil)
}

func (t *TelemetryEngine) InjectContext(span *Span) string {
	return "00-" + span.TraceID + "-" + span.SpanID + "-01"
}

func (t *TelemetryEngine) ExtractContext(traceparent string) map[string]string {
	parts := splitN(traceparent, '-', 4)
	if len(parts) < 4 || parts[0] != "00" {
		return nil
	}
	result := map[string]string{
		"traceId": parts[1],
		"parentSpanId": parts[2],
	}
	return result
}

func (t *TelemetryEngine) ExportOTLP() map[string]any {
	scopeSpans := []map[string]any{}
	scope := map[string]any{
		"name": "@autonomous-lifecycle-protocol-alp/telemetry",
		"version": "17.0.0",
	}
	spans := []map[string]any{}
	for _, s := range t.completedSpans {
		spanMap := map[string]any{
			"traceId": s.TraceID,
			"spanId": s.SpanID,
			"parentSpanId": emptyString(s.ParentSpanID),
			"name": s.Action,
			"kind": 1,
			"startTimeUnixNano": fmt.Sprintf("%d", s.StartTime*1000000),
		}
		endTime := s.StartTime
		if s.EndTime != nil {
			endTime = *s.EndTime
		}
		spanMap["endTimeUnixNano"] = fmt.Sprintf("%d", endTime*1000000)

		statusCode := 0
		if s.Status == "OK" {
			statusCode = 1
		} else if s.Status == "ERROR" {
			statusCode = 2
		}
		spanMap["status"] = map[string]any{"code": statusCode}

		attrs := []map[string]any{}
		for k, v := range s.Attributes {
			attrs = append(attrs, map[string]any{
				"key": k,
				"value": map[string]any{"stringValue": fmt.Sprintf("%v", v)},
			})
		}
		spanMap["attributes"] = attrs
		spans = append(spans, spanMap)
	}
	scopeSpan := map[string]any{
		"scope": scope,
		"spans": spans,
	}
	scopeSpans = append(scopeSpans, scopeSpan)

	resourceAttrs := []map[string]any{
		{"key": "service.name", "value": map[string]any{"stringValue": "alp-execution-engine"}},
		{"key": "telemetry.sdk.name", "value": map[string]any{"stringValue": "alp-telemetry"}},
	}
	resource := map[string]any{"attributes": resourceAttrs}

	resourceSpan := map[string]any{
		"resource": resource,
		"scopeSpans": scopeSpans,
	}

	return map[string]any{
		"resourceSpans": []map[string]any{resourceSpan},
	}
}

func (t *TelemetryEngine) GetTraceSummary() map[string]int {
	okCount := 0
	errorCount := 0
	for _, s := range t.completedSpans {
		if s.Status == "OK" {
			okCount++
		} else if s.Status == "ERROR" {
			errorCount++
		}
	}
	return map[string]int{
		"totalSpans": len(t.completedSpans) + len(t.activeSpans),
		"activeSpans": len(t.activeSpans),
		"okCount":    okCount,
		"errorCount": errorCount,
	}
}

func (t *TelemetryEngine) GetCompletedSpans() []*Span {
	result := make([]*Span, len(t.completedSpans))
	copy(result, t.completedSpans)
	return result
}

func randBytes(n int) []byte {
	b := make([]byte, n)
	// Use a simple deterministic approach for Go versions without crypto/rand convenience
	// In real code, use crypto/rand
	for i := range b {
		b[i] = byte(rand.Intn(256))
	}
	return b
}

func splitN(s string, sep rune, n int) []string {
	// Simple split implementation
	var parts []string
	current := ""
	count := 0
	for _, c := range s {
		if c == sep && count < n-1 {
			parts = append(parts, current)
			current = ""
			count++
		} else {
			current += string(c)
		}
	}
	parts = append(parts, current)
	return parts
}

func emptyString(s string) string {
	if s == "" {
		return ""
	}
	return s
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

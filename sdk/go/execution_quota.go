package alpgo

import (
	"fmt"
	"sync"
	"time"
)

type QuotaUsage struct {
	AgentID     string        `json:"agent_id"`
	Used        float64       `json:"used"`
	Limit       float64       `json:"limit"`
	Remaining   float64       `json:"remaining"`
	LastChecked time.Time     `json:"last_checked"`
}

type ExecutionQuotaEngine struct {
	mu        sync.Mutex
	quotas    map[string]QuotaUsage
	resetInterval time.Duration
}

func NewExecutionQuotaEngine(resetInterval time.Duration) *ExecutionQuotaEngine {
	if resetInterval <= 0 {
		resetInterval = time.Hour
	}
	return &ExecutionQuotaEngine{
		quotas:       make(map[string]QuotaUsage),
		resetInterval: resetInterval,
	}
}

func (e *ExecutionQuotaEngine) SetQuota(agentID string, limit float64) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.quotas[agentID] = QuotaUsage{
		AgentID:     agentID,
		Used:        0,
		Limit:       limit,
		Remaining:   limit,
		LastChecked: time.Now().UTC(),
	}
}

func (e *ExecutionQuotaEngine) Consume(agentID string, amount float64) (bool, error) {
	if amount <= 0 {
		return true, nil
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	q, ok := e.quotas[agentID]
	if !ok {
		return false, fmt.Errorf("quota not set for agent '%s'", agentID)
	}
	if time.Since(q.LastChecked) >= e.resetInterval {
		q.Used = 0
		q.Remaining = q.Limit
		q.LastChecked = time.Now().UTC()
	}
	if q.Remaining < amount {
		return false, fmt.Errorf("quota exceeded for agent '%s': remaining=%.2f, requested=%.2f", agentID, q.Remaining, amount)
	}
	q.Used += amount
	q.Remaining -= amount
	q.LastChecked = time.Now().UTC()
	e.quotas[agentID] = q
	return true, nil
}

func (e *ExecutionQuotaEngine) Remaining(agentID string) (float64, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	q, ok := e.quotas[agentID]
	if !ok {
		return 0, fmt.Errorf("quota not set for agent '%s'", agentID)
	}
	return q.Remaining, nil
}

func (e *ExecutionQuotaEngine) Reset(agentID string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	q, ok := e.quotas[agentID]
	if !ok {
		return
	}
	q.Used = 0
	q.Remaining = q.Limit
	q.LastChecked = time.Now().UTC()
	e.quotas[agentID] = q
}

func (e *ExecutionQuotaEngine) ResetAll() {
	e.mu.Lock()
	defer e.mu.Unlock()
	for id, q := range e.quotas {
		q.Used = 0
		q.Remaining = q.Limit
		q.LastChecked = time.Now().UTC()
		e.quotas[id] = q
	}
}

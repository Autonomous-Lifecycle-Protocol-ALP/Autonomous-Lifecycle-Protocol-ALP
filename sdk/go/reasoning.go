package alpgo

import (
	"fmt"
	"strings"
	"time"
)

type ReasoningStep struct {
	StepID      string   `json:"step_id"`
	AgentID     string   `json:"agent_id"`
	Thought     string   `json:"thought"`
	Action      string   `json:"action"`
	Observation string   `json:"observation,omitempty"`
	Confidence  float64  `json:"confidence"`
	Dependencies []string `json:"dependencies"`
	Timestamp   string   `json:"timestamp"`
}

type ReasoningChain struct {
	ChainID   string           `json:"chain_id"`
	Goal      string           `json:"goal"`
	Steps     []*ReasoningStep `json:"steps"`
	CreatedAt string           `json:"created_at"`
	Status    string           `json:"status"`
	Result    string           `json:"result,omitempty"`
}

type ReasoningTracer struct {
	chains       map[string]*ReasoningChain
	stepCounter  int
}

func NewReasoningTracer() *ReasoningTracer {
	return &ReasoningTracer{
		chains: make(map[string]*ReasoningChain),
	}
}

func (r *ReasoningTracer) CreateChain(goal string) *ReasoningChain {
	chainID := fmt.Sprintf("chain-%d-%s", time.Now().UnixNano(), randomSuffix(5))
	chain := &ReasoningChain{
		ChainID:   chainID,
		Goal:      goal,
		Steps:     []*ReasoningStep{},
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
		Status:    "draft",
	}
	r.chains[chainID] = chain
	return chain
}

func (r *ReasoningTracer) AddStep(chainID string, input ReasoningStep) (*ReasoningStep, error) {
	chain, ok := r.chains[chainID]
	if !ok {
		return nil, fmt.Errorf("reasoning chain '%s' not found", chainID)
	}
	if chain.Status != "executing" {
		chain.Status = "executing"
	}
	r.stepCounter++
	step := &ReasoningStep{
		StepID:      fmt.Sprintf("step-%s-%d", chainID, r.stepCounter),
		AgentID:     input.AgentID,
		Thought:     input.Thought,
		Action:      input.Action,
		Observation: input.Observation,
		Confidence:  input.Confidence,
		Dependencies: input.Dependencies,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}
	chain.Steps = append(chain.Steps, step)
	return step, nil
}

func (r *ReasoningTracer) CompleteChain(chainID, result string) (*ReasoningChain, error) {
	chain, ok := r.chains[chainID]
	if !ok {
		return nil, fmt.Errorf("reasoning chain '%s' not found", chainID)
	}
	chain.Status = "completed"
	chain.Result = result
	return chain, nil
}

func (r *ReasoningTracer) FailChain(chainID, reason string) (*ReasoningChain, error) {
	chain, ok := r.chains[chainID]
	if !ok {
		return nil, fmt.Errorf("reasoning chain '%s' not found", chainID)
	}
	chain.Status = "failed"
	chain.Result = reason
	return chain, nil
}

func (r *ReasoningTracer) GetChain(chainID string) (*ReasoningChain, bool) {
	chain, ok := r.chains[chainID]
	return chain, ok
}

func (r *ReasoningTracer) GetStepsByAgent(agentID string) []*ReasoningStep {
	var steps []*ReasoningStep
	for _, chain := range r.chains {
		for _, step := range chain.Steps {
			if step.AgentID == agentID {
				steps = append(steps, step)
			}
		}
	}
	return steps
}

func randomSuffix(n int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	var b strings.Builder
	for i := 0; i < n; i++ {
		b.WriteByte(chars[time.Now().UnixNano()%int64(len(chars))])
	}
	return b.String()
}

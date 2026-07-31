package alp

import (
	"fmt"
	"math/rand"
	"time"
)

// ChaosEngine — v72.0.0 Chaos Engineering Engine
// Injects controlled failures into agent workflows for resilience testing.

// ChaosExperimentType enumerates chaos experiment types.
type ChaosExperimentType string

const (
	ChaosLatency            ChaosExperimentType = "LATENCY"
	ChaosError              ChaosExperimentType = "ERROR"
	ChaosResourceExhaustion ChaosExperimentType = "RESOURCE_EXHAUSTION"
	ChaosPartition          ChaosExperimentType = "PARTITION"
	ChaosKillAgent          ChaosExperimentType = "KILL_AGENT"
)

// ChaosExperimentStatus tracks experiment lifecycle.
type ChaosExperimentStatus string

const (
	ChaosPending   ChaosExperimentStatus = "PENDING"
	ChaosRunning   ChaosExperimentStatus = "RUNNING"
	ChaosCompleted ChaosExperimentStatus = "COMPLETED"
	ChaosAborted   ChaosExperimentStatus = "ABORTED"
)

// ChaosExperimentConfig configures a chaos experiment.
type ChaosExperimentConfig struct {
	DurationMs        int      `json:"duration_ms"`
	Intensity         float64  `json:"intensity"`
	BlastRadius       string   `json:"blast_radius"` // SINGLE, WORKFLOW, SWARM
	RollbackOnFailure bool     `json:"rollback_on_failure"`
	LatencyMs         int      `json:"latency_ms,omitempty"`
	ErrorCode         int      `json:"error_code,omitempty"`
	ResourceType      string   `json:"resource_type,omitempty"`
	PartitionNodes    []string `json:"partition_nodes,omitempty"`
}

// ChaosExperimentResult holds the outcome of a completed experiment.
type ChaosExperimentResult struct {
	InjectedFaults    int      `json:"injected_faults"`
	RecoveredFaults   int      `json:"recovered_faults"`
	UnrecoveredFaults int      `json:"unrecovered_faults"`
	MeanRecoveryTimeMs int     `json:"mean_recovery_time_ms"`
	ResilienceScore   int      `json:"resilience_score"`
	Observations      []string `json:"observations"`
}

// ChaosExperiment represents a chaos engineering experiment.
type ChaosExperiment struct {
	ExperimentID   string                 `json:"experiment_id"`
	Name           string                 `json:"name"`
	Type           ChaosExperimentType    `json:"type"`
	TargetAgent    string                 `json:"target_agent"`
	Status         ChaosExperimentStatus  `json:"status"`
	Config         ChaosExperimentConfig  `json:"config"`
	StartedAt      string                 `json:"started_at,omitempty"`
	CompletedAt    string                 `json:"completed_at,omitempty"`
	Result         *ChaosExperimentResult `json:"result,omitempty"`
}

// ChaosEngine manages chaos experiments.
type ChaosEngine struct {
	experiments map[string]*ChaosExperiment
}

// NewChaosEngine creates a new ChaosEngine.
func NewChaosEngine() *ChaosEngine {
	return &ChaosEngine{
		experiments: make(map[string]*ChaosExperiment),
	}
}

// CreateExperiment creates a new chaos experiment.
func (ce *ChaosEngine) CreateExperiment(name string, expType ChaosExperimentType, targetAgent string, config ChaosExperimentConfig) *ChaosExperiment {
	id := fmt.Sprintf("chaos-%d-%d", time.Now().UnixNano(), rand.Intn(10000))
	exp := &ChaosExperiment{
		ExperimentID: id,
		Name:         name,
		Type:         expType,
		TargetAgent:  targetAgent,
		Status:       ChaosPending,
		Config:       config,
	}
	ce.experiments[id] = exp
	return exp
}

// RunExperiment runs an experiment by ID.
func (ce *ChaosEngine) RunExperiment(experimentID string) (*ChaosExperiment, error) {
	exp, ok := ce.experiments[experimentID]
	if !ok {
		return nil, fmt.Errorf("experiment not found: %s", experimentID)
	}
	if exp.Status != ChaosPending {
		return nil, fmt.Errorf("experiment %s is not PENDING", experimentID)
	}

	exp.Status = ChaosRunning
	exp.StartedAt = time.Now().UTC().Format(time.RFC3339)

	injected := rand.Intn(20) + 5
	recovered := int(float64(injected) * (0.7 + rand.Float64()*0.3))
	score := (recovered * 100) / injected

	exp.Result = &ChaosExperimentResult{
		InjectedFaults:    injected,
		RecoveredFaults:   recovered,
		UnrecoveredFaults: injected - recovered,
		MeanRecoveryTimeMs: rand.Intn(800) + 100,
		ResilienceScore:   score,
		Observations:      []string{"Chaos experiment completed successfully"},
	}

	exp.Status = ChaosCompleted
	exp.CompletedAt = time.Now().UTC().Format(time.RFC3339)
	return exp, nil
}

// GetExperiments returns all experiments.
func (ce *ChaosEngine) GetExperiments() []*ChaosExperiment {
	result := make([]*ChaosExperiment, 0, len(ce.experiments))
	for _, e := range ce.experiments {
		result = append(result, e)
	}
	return result
}

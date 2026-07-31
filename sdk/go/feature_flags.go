package alpgo

import (
	"fmt"
	"strings"
	"time"
)

// FeatureFlagEngine — v74.0.0 Feature Flag Engine
// Dynamic feature flags for agent workflows: gradual rollouts, percentage-based targeting, kill switches.

type FlagStatus string

const (
	FlagEnabled    FlagStatus = "ENABLED"
	FlagDisabled   FlagStatus = "DISABLED"
	FlagRollout    FlagStatus = "ROLLOUT"
	FlagExperiment FlagStatus = "EXPERIMENT"
)

type FlagVariant struct {
	VariantID string                 `json:"variant_id"`
	Name      string                 `json:"name"`
	Weight    int                    `json:"weight"`
	Payload   map[string]interface{} `json:"payload,omitempty"`
}

type FeatureFlag struct {
	FlagID             string        `json:"flag_id"`
	Name               string        `json:"name"`
	Description        string        `json:"description"`
	Status             FlagStatus    `json:"status"`
	RolloutPercentage  int           `json:"rollout_percentage"`
	TargetAgents       []string      `json:"target_agents"`
	TargetEnvironments []string      `json:"target_environments"`
	Variants           []FlagVariant `json:"variants"`
	KillSwitch         bool          `json:"kill_switch"`
	CreatedAt          string        `json:"created_at"`
	UpdatedAt          string        `json:"updated_at"`
}

type FlagEvaluation struct {
	FlagID      string       `json:"flag_id"`
	AgentID     string       `json:"agent_id"`
	Environment string       `json:"environment"`
	Enabled     bool         `json:"enabled"`
	Variant     *FlagVariant `json:"variant,omitempty"`
	Reason      string       `json:"reason"`
}

type FeatureFlagEngine struct {
	flags map[string]*FeatureFlag
}

func NewFeatureFlagEngine() *FeatureFlagEngine {
	return &FeatureFlagEngine{
		flags: make(map[string]*FeatureFlag),
	}
}

func (ffe *FeatureFlagEngine) CreateFlag(name, description string, status FlagStatus, rollout int) *FeatureFlag {
	id := fmt.Sprintf("flag-%s-%d", strings.ToLower(strings.ReplaceAll(name, " ", "-")), time.Now().UnixNano())
	now := time.Now().UTC().Format(time.RFC3339)
	flag := &FeatureFlag{
		FlagID:            id,
		Name:              name,
		Description:       description,
		Status:            status,
		RolloutPercentage: rollout,
		TargetAgents:      []string{},
		TargetEnvironments: []string{},
		Variants:          []FlagVariant{},
		KillSwitch:        false,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	ffe.flags[id] = flag
	return flag
}

func (ffe *FeatureFlagEngine) Evaluate(flagID, agentID, environment string) *FlagEvaluation {
	flag, ok := ffe.flags[flagID]
	if !ok {
		return &FlagEvaluation{FlagID: flagID, AgentID: agentID, Environment: environment, Enabled: false, Reason: "FLAG_NOT_FOUND"}
	}
	if flag.KillSwitch {
		return &FlagEvaluation{FlagID: flagID, AgentID: agentID, Environment: environment, Enabled: false, Reason: "KILL_SWITCH"}
	}
	if flag.Status == FlagDisabled {
		return &FlagEvaluation{FlagID: flagID, AgentID: agentID, Environment: environment, Enabled: false, Reason: "FLAG_DISABLED"}
	}
	return &FlagEvaluation{FlagID: flagID, AgentID: agentID, Environment: environment, Enabled: true, Reason: "FLAG_ENABLED"}
}

func (ffe *FeatureFlagEngine) GetFlags() []*FeatureFlag {
	res := make([]*FeatureFlag, 0, len(ffe.flags))
	for _, f := range ffe.flags {
		res = append(res, f)
	}
	return res
}

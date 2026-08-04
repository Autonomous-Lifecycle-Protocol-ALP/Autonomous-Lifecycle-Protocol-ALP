package alpgo

import (
	"fmt"
	"math"
	"sort"
)

type AgentRecord struct {
	AgentID         string  `json:"agent_id"`
	Role            string  `json:"role"`
	Load            float64 `json:"load"`
	Capacity        float64 `json:"capacity"`
	SuccessRate     float64 `json:"success_rate"`
	Specializations []string `json:"specializations"`
}

type SwarmDecision struct {
	DecisionID   string  `json:"decision_id"`
	Proposal     string  `json:"proposal"`
	Score        float64 `json:"score"`
	Votes        int     `json:"votes"`
	QuorumMet    bool    `json:"quorum_met"`
	Participants []string `json:"participants"`
}

type EmergentBehaviorDetector struct {
	threshold float64
}

func NewEmergentBehaviorDetector(threshold float64) *EmergentBehaviorDetector {
	if threshold <= 0 {
		threshold = 0.8
	}
	return &EmergentBehaviorDetector{threshold: threshold}
}

func (e *EmergentBehaviorDetector) Detect(agents []AgentRecord) []string {
	var signs []string
	loads := make([]float64, len(agents))
	for i, a := range agents {
		loads[i] = a.Load / maxFloat64(a.Capacity, 0.001)
	}
	if len(loads) > 1 {
		avg := average(loads)
		std := stddev(loads, avg)
		if std > 0.25 {
			signs = append(signs, fmt.Sprintf("load_variance=%.4f", std))
		}
	}
	roleCount := map[string]int{}
	for _, a := range agents {
		roleCount[a.Role]++
	}
	if len(roleCount) > 0 {
		minCount := len(agents)
		maxCount := 0
		for _, c := range roleCount {
			if c < minCount {
				minCount = c
			}
			if c > maxCount {
				maxCount = c
			}
		}
		imbalance := 0.0
		if maxCount > 0 {
			imbalance = float64(maxCount-minCount) / float64(maxCount)
		}
		if imbalance > 0.4 {
			signs = append(signs, fmt.Sprintf("role_imbalance=%.4f", imbalance))
		}
	}
	return signs
}

type RoleSpecializer struct{}

func NewRoleSpecializer() *RoleSpecializer {
	return &RoleSpecializer{}
}

func (r *RoleSpecializer) AssignRoles(agents []AgentRecord) map[string]string {
	assignments := map[string]string{}
	type roleScore struct {
		agentID string
		score   float64
	}
	for _, agent := range agents {
		bestRole := agent.Role
		bestScore := 0.0
		for _, spec := range agent.Specializations {
			score := agent.SuccessRate * (1.0 - agent.Load/maxFloat64(agent.Capacity, 0.001))
			if score > bestScore {
				bestScore = score
				bestRole = spec
			}
		}
		assignments[agent.AgentID] = bestRole
	}
	return assignments
}

type CollectiveDecisionMaker struct {
	quorum int
}

func NewCollectiveDecisionMaker(quorum int) *CollectiveDecisionMaker {
	if quorum <= 0 {
		quorum = 3
	}
	return &CollectiveDecisionMaker{quorum: quorum}
}

func (c *CollectiveDecisionMaker) Decide(proposals []string, voters []AgentRecord) *SwarmDecision {
	if len(proposals) == 0 || len(voters) == 0 {
		return nil
	}
	votes := map[string]int{}
	participants := []string{}
	for _, voter := range voters {
		if voter.Load < c.thresholdLoad() {
			choice := proposals[int(voter.SuccessRate*float64(len(proposals)))%len(proposals)]
			votes[choice]++
			participants = append(participants, voter.AgentID)
		}
	}
	type decision struct {
		proposal string
		votes    int
	}
	var ranked []decision
	for proposal, count := range votes {
		ranked = append(ranked, decision{proposal: proposal, votes: count})
	}
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].votes > ranked[j].votes
	})
	if len(ranked) == 0 {
		return nil
	}
	winner := ranked[0]
	return &SwarmDecision{
		DecisionID:   fmt.Sprintf("decision-%d", len(participants)),
		Proposal:     winner.proposal,
		Score:        float64(winner.votes) / float64(len(participants)),
		Votes:        winner.votes,
		QuorumMet:    winner.votes >= c.quorum,
		Participants: participants,
	}
}

func (c *CollectiveDecisionMaker) thresholdLoad() float64 {
	return 0.9
}

func maxFloat64(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func average(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	var sum float64
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func stddev(values []float64, avg float64) float64 {
	if len(values) == 0 {
		return 0
	}
	var sumSq float64
	for _, v := range values {
		d := v - avg
		sumSq += d * d
	}
	return math.Sqrt(sumSq / float64(len(values)))
}

package alpgo

import (
	"fmt"
	"math"
	"sort"
)

type AnomalyScore struct {
	Score        float64
	Factors      []string
	Baseline     map[string]interface{}
	Recommendation string
}

func NewAnomalyScore(score float64, factors []string, baseline map[string]interface{}, recommendation string) *AnomalyScore {
	return &AnomalyScore{
		Score:        score,
		Factors:      factors,
		Baseline:     baseline,
		Recommendation: recommendation,
	}
}

func (a *AnomalyScore) IsAnomalous(threshold float64) bool {
	return a.Score >= threshold
}

func (a *AnomalyScore) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"score":         a.Score,
		"factors":       a.Factors,
		"baseline":      a.Baseline,
		"recommendation": a.Recommendation,
	}
}

type BaselineProfile struct {
	Kind            string
	Value           string
	SampleCount     int
	MeanFrequency   float64
	StddevFrequency float64
	FailureRate     float64
	LastSeen        string
}

func NewBaselineProfile(kind, value string, sampleCount int, meanFreq, stddevFreq, failureRate float64, lastSeen string) *BaselineProfile {
	return &BaselineProfile{
		Kind:            kind,
		Value:           value,
		SampleCount:     sampleCount,
		MeanFrequency:   meanFreq,
		StddevFrequency: stddevFreq,
		FailureRate:     failureRate,
		LastSeen:        lastSeen,
	}
}

func (b *BaselineProfile) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"kind":             b.Kind,
		"value":            b.Value,
		"sample_count":     b.SampleCount,
		"mean_frequency":   b.MeanFrequency,
		"stddev_frequency": b.StddevFrequency,
		"failure_rate":     b.FailureRate,
		"last_seen":        b.LastSeen,
	}
}

type PredictivePolicyEngine struct {
	engine      *PolicyEngine
	zThreshold  float64
	minSamples  int
	baselines   map[string]*BaselineProfile
	history     []HistoryEntry
}

type HistoryEntry struct {
	Query    *PolicyQuery
	Decision *PolicyDecision
}

func NewPredictivePolicyEngine(objects []*AlpObject) *PredictivePolicyEngine {
	return &PredictivePolicyEngine{
		engine:      NewPolicyEngine(objects),
		zThreshold:  2.5,
		minSamples:  5,
		baselines:   make(map[string]*BaselineProfile),
		history:     []HistoryEntry{},
	}
}

func (e *PredictivePolicyEngine) Evaluate(query *PolicyQuery) *PolicyDecision {
	anomaly := e.scoreQuery(query)
	decision := e.engine.Evaluate(query)
	if decision.Audit == nil {
		decision.Audit = make(map[string]interface{})
	}
	decision.Audit["anomaly"] = anomaly.ToMap()
	e.history = append(e.history, HistoryEntry{Query: query, Decision: decision})
	return decision
}

func (e *PredictivePolicyEngine) EvaluateDenyOnly(query *PolicyQuery) *PolicyDecision {
	anomaly := e.scoreQuery(query)
	decision := e.engine.Evaluate(query)
	if decision.Audit == nil {
		decision.Audit = make(map[string]interface{})
	}
	decision.Audit["anomaly"] = anomaly.ToMap()
	e.history = append(e.history, HistoryEntry{Query: query, Decision: decision})
	return decision
}

func (e *PredictivePolicyEngine) EvaluateProposal(proposalID string) *PolicyDecision {
	anomaly := NewAnomalyScore(0.0, []string{}, map[string]interface{}{}, "monitor")
	decision := &PolicyDecision{
		Allowed:         false,
		Blocked:         false,
		Reasons:         []string{},
		Policies:        []string{},
		RequiresApproval: false,
		Audit:           map[string]interface{}{"anomaly": anomaly.ToMap()},
	}
	e.history = append(e.history, HistoryEntry{Query: &PolicyQuery{Kind: "proposal", Value: &proposalID}, Decision: decision})
	return decision
}

func (e *PredictivePolicyEngine) GetBaselines() []*BaselineProfile {
	result := make([]*BaselineProfile, 0, len(e.baselines))
	for _, b := range e.baselines {
		result = append(result, b)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Kind != result[j].Kind {
			return result[i].Kind < result[j].Kind
		}
		return result[i].Value < result[j].Value
	})
	return result
}

func (e *PredictivePolicyEngine) GetBaseline(kind, value string) *BaselineProfile {
	return e.baselines[fmt.Sprintf("%s:%s", kind, value)]
}

func (e *PredictivePolicyEngine) GetHistory() []HistoryEntry {
	return e.history
}

func (e *PredictivePolicyEngine) AnomaliesSummary(policyID *string) map[string]interface{} {
	items := []map[string]interface{}{}
	anomalousCount := 0
	for _, entry := range e.history {
		anomaly, _ := entry.Decision.Audit["anomaly"].(map[string]interface{})
		if anomaly == nil {
			continue
		}
		if policyID != nil {
			found := false
			for _, p := range entry.Decision.Policies {
				if p == *policyID {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}
		score := 0.0
		if s, ok := anomaly["score"].(float64); ok {
			score = s
		}
		if score >= e.zThreshold {
			anomalousCount++
		}
		items = append(items, map[string]interface{}{
			"kind":          entry.Query.Kind,
			"value":         *entry.Query.Value,
			"score":         score,
			"factors":       anomaly["factors"],
			"recommendation": anomaly["recommendation"],
		})
	}
	return map[string]interface{}{
		"total":     len(items),
		"anomalous": anomalousCount,
		"items":     items,
	}
}

func (e *PredictivePolicyEngine) LearnFromEvents(events []EventEntry) {
	counts := map[string]int{}
	failures := map[string]int{}
	lastSeen := map[string]string{}
	samples := map[string][]float64{}

	for _, event := range events {
		kind := event.PayloadKind
		value := event.PayloadValue
		if kind == "" || value == "" {
			continue
		}
		key := fmt.Sprintf("%s:%s", kind, value)
		counts[key]++
		samples[key] = append(samples[key], float64(counts[key]))
		if event.Status == "[!]" || event.Blocked {
			failures[key]++
		}
		lastSeen[key] = event.Timestamp
	}

	for key, count := range counts {
		parts := splitKey(key)
		freqs := samples[key]
		meanFreq := avg(freqs)
		stddevFreq := calcStddev(freqs)
		failureRate := 0.0
		if count > 0 {
			failureRate = float64(failures[key]) / float64(count)
		}
		e.baselines[key] = NewBaselineProfile(
			parts[0], parts[1], count, meanFreq, stddevFreq, failureRate, lastSeen[key],
		)
	}
}

func (e *PredictivePolicyEngine) scoreQuery(query *PolicyQuery) *AnomalyScore {
	key := fmt.Sprintf("%s:%s", query.Kind, *query.Value)
	profile := e.baselines[key]

	factors := []string{}
	scoreComponents := []float64{}

	if profile == nil || profile.SampleCount < e.minSamples {
		factors = append(factors, "insufficient_history")
		scoreComponents = append(scoreComponents, 0.3)
	} else {
		if profile.FailureRate > 0.3 {
			factors = append(factors, "high_failure_rate")
			scoreComponents = append(scoreComponents, minFloat(profile.FailureRate, 1.0))
		}
		if profile.StddevFrequency > 2.0 {
			factors = append(factors, "high_frequency_variance")
			scoreComponents = append(scoreComponents, 0.5)
		}
	}

	recent := 0
	for _, entry := range e.history {
		if entry.Query.Kind == query.Kind && *entry.Query.Value == *query.Value {
			recent++
		}
	}
	if recent == 0 {
		factors = append(factors, "rare_request")
		scoreComponents = append(scoreComponents, 0.4)
	} else if recent > 10 {
		factors = append(factors, "burst")
		scoreComponents = append(scoreComponents, 0.3)
	}

	score := 0.0
	if len(scoreComponents) > 0 {
		score = sum(scoreComponents) / float64(len(scoreComponents))
	}
	score = minFloat(score, 1.0)
	score = roundFloat(score, 3)

	recommendation := "monitor"
	if score >= 0.8 {
		recommendation = "escalate"
	} else if score >= 0.5 {
		recommendation = "require_approval"
	}

	baselineMap := map[string]interface{}{}
	if profile != nil {
		baselineMap = profile.ToMap()
	}

	return NewAnomalyScore(score, factors, baselineMap, recommendation)
}

type EventEntry struct {
	PayloadKind  string
	PayloadValue string
	Status       string
	Blocked      bool
	Timestamp    string
}

func splitKey(key string) [2]string {
	for i := len(key) - 1; i >= 0; i-- {
		if key[i] == ':' {
			return [2]string{key[:i], key[i+1:]}
		}
	}
	return [2]string{key, ""}
}

func avg(values []float64) float64 {
	if len(values) == 0 {
		return 0.0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func calcStddev(values []float64) float64 {
	if len(values) < 2 {
		return 0.0
	}
	m := avg(values)
	variance := 0.0
	for _, v := range values {
		d := v - m
		variance += d * d
	}
	return math.Sqrt(variance / float64(len(values)-1))
}

func sum(values []float64) float64 {
	s := 0.0
	for _, v := range values {
		s += v
	}
	return s
}

func minFloat(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func roundFloat(x float64, prec int) float64 {
	p := math.Pow(10, float64(prec))
	return math.Round(x*p) / p
}

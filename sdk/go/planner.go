package alpgo

import (
	"fmt"
	"math"
	"sort"
	"strings"
)

type PlanNode struct {
	ID        string   `json:"id"`
	Kind      string   `json:"kind"`
	Label     string   `json:"label"`
	DependsOn []string `json:"depends_on"`
}

type Plan struct {
	PlanID    string              `json:"plan_id"`
	Goal      string              `json:"goal"`
	Nodes     []*PlanNode         `json:"nodes"`
	Metadata  map[string]any      `json:"metadata"`
}

type ImprovementProposal struct {
	ProposalID   string  `json:"proposal_id"`
	LessonID     string  `json:"lesson_id"`
	TargetNodeID string  `json:"target_node_id,omitempty"`
	Action       string  `json:"action"`
	Detail       string  `json:"detail"`
	Confidence   float64 `json:"confidence"`
}

type Lesson struct {
	LessonID string   `json:"lesson_id"`
	RunID    string   `json:"run_id"`
	Insight  string   `json:"insight"`
	Severity string   `json:"severity"`
	Tags     []string `json:"tags"`
}

func NewPlanNode(id, kind, label string, dependsOn []string) *PlanNode {
	return &PlanNode{
		ID:        id,
		Kind:      kind,
		Label:     label,
		DependsOn: dependsOn,
	}
}

func NewPlan(planID, goal string, nodes []*PlanNode, metadata map[string]any) *Plan {
	if metadata == nil {
		metadata = make(map[string]any)
	}
	return &Plan{
		PlanID:   planID,
		Goal:     goal,
		Nodes:    nodes,
		Metadata: metadata,
	}
}

type GoalDecomposer struct{}

func (g *GoalDecomposer) Decompose(goal string, constraints map[string]any) *Plan {
	goal = sanitizeGoal(goal)
	if goal == "" {
		return nil
	}
	planID := limitID(goal, 40)
	steps := extractVerbs(goal)
	nodes := make([]*PlanNode, 0, len(steps))
	for i, step := range steps {
		var deps []string
		if i > 0 {
			deps = []string{fmt.Sprintf("step-%d", i)}
		}
		nodes = append(nodes, NewPlanNode(fmt.Sprintf("step-%d", i+1), "task", step, deps))
	}
	meta := map[string]any{"constraints": constraints}
	if constraints == nil {
		meta["constraints"] = map[string]any{}
	}
	return NewPlan(planID, goal, nodes, meta)
}

func (g *GoalDecomposer) ToWorkflow(plan *Plan) *Plan {
	return plan
}

type Planner struct{}

func (p *Planner) Rank(plans []*Plan) []*RankedPlan {
	scored := make([]*RankedPlan, 0, len(plans))
	for _, plan := range plans {
		scored = append(scored, &RankedPlan{
			Plan:  plan,
			Score: p.Score(plan),
		})
	}
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score.Composite > scored[j].Score.Composite
	})
	for i, entry := range scored {
		entry.Rank = i + 1
	}
	return scored
}

type RankedPlan struct {
	Plan  *Plan     `json:"plan"`
	Score PlanScore `json:"score"`
	Rank  int       `json:"rank"`
}

type PlanScore struct {
	NodeCount int     `json:"node_count"`
	Depth     int     `json:"depth"`
	Risk      float64 `json:"risk"`
	Confidence string `json:"confidence"`
	Complexity float64 `json:"complexity"`
	Composite float64 `json:"composite"`
}

func (p *Planner) Score(plan *Plan) PlanScore {
	nodeCount := len(plan.Nodes)
	depth := maxDepth(plan)
	risk := 0.5
	confidence := "low"
	complexity := float64(nodeCount)*0.1 + float64(depth)*0.2
	composite := math.Max(0.0, 1.0-risk-complexity*0.1)
	return PlanScore{
		NodeCount: nodeCount,
		Depth:     depth,
		Risk:      risk,
		Confidence: confidence,
		Complexity: math.Round(complexity*10000) / 10000,
		Composite: math.Round(composite*10000) / 10000,
	}
}

type Reflector struct {
	Events []map[string]any
}

func NewReflector(events []map[string]any) *Reflector {
	if events == nil {
		events = []map[string]any{}
	}
	return &Reflector{Events: events}
}

func (r *Reflector) Reflect(runID string) []Lesson {
	var lessons []Lesson
	lessons = append(lessons, r.detectFailurePatterns(runID)...)
	lessons = append(lessons, r.detectInefficiencies(runID)...)
	lessons = append(lessons, r.detectHandoffPatterns(runID)...)
	return lessons
}

func (r *Reflector) detectFailurePatterns(runID string) []Lesson {
	var lessons []Lesson
	taskFailures := map[string]int{}
	for _, e := range r.Events {
		if e["type"] == "task_status" && e["status"] == "[!]" {
			tid, _ := e["task_id"].(string)
			if tid != "" {
				taskFailures[tid]++
			}
		}
	}
	for tid, count := range taskFailures {
		if count >= 2 {
			lessons = append(lessons, Lesson{
				LessonID: fmt.Sprintf("lesson-%d", len(lessons)+1),
				RunID:    runID,
				Insight:  fmt.Sprintf("Task '%s' failed %d times; consider retry or fallback strategy.", tid, count),
				Severity: "warn",
				Tags:     []string{"failure", tid},
			})
		}
	}
	return lessons
}

func (r *Reflector) detectInefficiencies(runID string) []Lesson {
	var lessons []Lesson
	claimCounts := map[string]int{}
	for _, e := range r.Events {
		if e["type"] == "task_claim" {
			tid, _ := e["task_id"].(string)
			if tid != "" {
				claimCounts[tid]++
			}
		}
	}
	for tid, count := range claimCounts {
		if count >= 3 {
			lessons = append(lessons, Lesson{
				LessonID: fmt.Sprintf("lesson-%d", len(lessons)+1),
				RunID:    runID,
				Insight:  fmt.Sprintf("Task '%s' was claimed %d times; review ownership logic.", tid, count),
				Severity: "info",
				Tags:     []string{"efficiency", tid},
			})
		}
	}
	return lessons
}

func (r *Reflector) detectHandoffPatterns(runID string) []Lesson {
	handoffs := 0
	for _, e := range r.Events {
		if e["type"] == "human_handoff" || e["status"] == "[?]" {
			handoffs++
		}
	}
	if handoffs > 1 {
		return []Lesson{{
			LessonID: fmt.Sprintf("lesson-%d", 1),
			RunID:    runID,
			Insight:  fmt.Sprintf("Run had %d human handoffs; consider automating or simplifying decision gates.", handoffs),
			Severity: "warn",
			Tags:     []string{"handoff"},
		}}
	}
	return []Lesson{}
}

func (r *Reflector) ImprovePlan(plan *Plan, lessons []Lesson, constraints map[string]any) map[string]any {
	if plan == nil {
		return map[string]any{"plan": (*Plan)(nil), "proposals": []ImprovementProposal{}}
	}
	nodes := make([]*PlanNode, len(plan.Nodes))
	copy(nodes, plan.Nodes)
	seen := map[string]bool{}
	var proposals []ImprovementProposal
	for _, lesson := range lessons {
		contains := func(s []string, v string) bool {
			for _, x := range s {
				if x == v {
					return true
				}
			}
			return false
		}
		if contains(lesson.Tags, "failure") && contains(lesson.Tags, "failed") {
			target := extractTaskID(lesson.Insight)
			proposals = append(proposals, ImprovementProposal{
				ProposalID:   fmt.Sprintf("prop-%d", len(proposals)+1),
				LessonID:     lesson.LessonID,
				TargetNodeID: target,
				Action:       "add_dependency",
				Detail:       fmt.Sprintf("Add fallback or retry dependency for '%s' due to repeated failures.", target),
				Confidence:   0.75,
			})
		}
		if contains(lesson.Tags, "efficiency") && contains(lesson.Tags, "claimed") {
			target := extractTaskID(lesson.Insight)
			proposals = append(proposals, ImprovementProposal{
				ProposalID:   fmt.Sprintf("prop-%d", len(proposals)+1),
				LessonID:     lesson.LessonID,
				TargetNodeID: target,
				Action:       "reassign",
				Detail:       fmt.Sprintf("Reassign '%s' to a more stable owner.", target),
				Confidence:   0.6,
			})
		}
		if contains(lesson.Tags, "handoff") {
			proposals = append(proposals, ImprovementProposal{
				ProposalID: fmt.Sprintf("prop-%d", len(proposals)+1),
				LessonID:   lesson.LessonID,
				Action:     "add_node",
				Detail:     "Add automation gate to reduce human handoff frequency.",
				Confidence: 0.5,
			})
		}
	}
	maxNodes := 0
	if constraints != nil {
		if v, ok := constraints["max_nodes"].(int); ok {
			maxNodes = v
		}
	}
	for _, p := range proposals {
		if p.Action == "add_node" && !seen[p.ProposalID] {
			if maxNodes > 0 && len(nodes) >= maxNodes {
				continue
			}
			nodes = append(nodes, NewPlanNode(fmt.Sprintf("node-%s", p.ProposalID), "task", p.Detail, []string{}))
			seen[p.ProposalID] = true
		}
	}
	improved := NewPlan(plan.PlanID, plan.Goal, nodes, map[string]any{"improvements": collectActions(proposals)})
	for k, v := range plan.Metadata {
		improved.Metadata[k] = v
	}
	return map[string]any{
		"plan":      improved,
		"proposals": proposals,
	}
}

type CollabPlanner struct {
	estimator any
}

func NewCollabPlanner(estimator any) *CollabPlanner {
	return &CollabPlanner{estimator: estimator}
}

func (c *CollabPlanner) Build(goal string, constraints map[string]any) *Plan {
	if constraints == nil {
		constraints = map[string]any{}
	}
	decomposer := &GoalDecomposer{}
	plan := decomposer.Decompose(goal, constraints)
	if plan == nil {
		return nil
	}
	planner := &Planner{}
	ranked := planner.Rank([]*Plan{plan})
	if len(ranked) > 0 {
		plan = ranked[0].Plan
	}
	if c.estimator != nil {
		plan.Metadata["negotiation"] = "accepted"
	}
	return plan
}

func maxDepth(plan *Plan) int {
	if len(plan.Nodes) == 0 {
		return 0
	}
	depths := map[string]int{}
	for _, n := range plan.Nodes {
		depths[n.ID] = 1
	}
	for _, n := range plan.Nodes {
		for _, dep := range n.DependsOn {
			if d, ok := depths[dep]; ok {
				depths[n.ID] = max(depths[n.ID], d+1)
			}
		}
	}
	m := 0
	for _, d := range depths {
		if d > m {
			m = d
		}
	}
	return m
}

func extractTaskID(insight string) string {
	parts := strings.Split(insight, "'")
	if len(parts) >= 2 {
		return parts[1]
	}
	return "unknown"
}

func collectActions(proposals []ImprovementProposal) []string {
	actions := make([]string, 0, len(proposals))
	for _, p := range proposals {
		actions = append(actions, p.Action)
	}
	return actions
}

func sanitizeGoal(goal string) string {
	goal = strings.TrimSpace(goal)
	goal = replaceAll(goal, "[^a-z0-9_-]+", "-")
	return limitID(goal, 40)
}

func replaceAll(s, pattern, replacement string) string {
	// simple regex-free replacement for non-regexp build tags
	var result strings.Builder
	last := 0
	for i := 0; i < len(s); {
		if i+len(pattern) <= len(s) && s[i:i+len(pattern)] == pattern {
			result.WriteString(s[last:i])
			result.WriteString(replacement)
			last = i + len(pattern)
			i = last
		} else {
			i++
		}
	}
	result.WriteString(s[last:])
	return result.String()
}

func limitID(s string, max int) string {
	if len(s) > max {
		return s[:max]
	}
	if s == "" {
		return "plan"
	}
	return s
}

func extractVerbs(goal string) []string {
	words := strings.Fields(goal)
	var verbs []string
	for _, w := range words {
		clean := strings.Trim(w, ".,!?:;")
		if len(clean) > 2 && clean[0] >= 'A' && clean[0] <= 'Z' {
			verbs = append(verbs, clean)
		}
	}
	if len(verbs) == 0 {
		return []string{goal}
	}
	return verbs
}

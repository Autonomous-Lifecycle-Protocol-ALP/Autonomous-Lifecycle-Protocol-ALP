package alpgo

import (
	"strings"
)

type PolicyContext struct {
	ContextID   string            `json:"context_id"`
	Environment map[string]string `json:"environment"`
	Tags        []string          `json:"tags"`
}

type PolicyLearner struct {
	history []PolicyContext
}

func NewPolicyLearner() *PolicyLearner {
	return &PolicyLearner{history: []PolicyContext{}}
}

func (p *PolicyLearner) Learn(ctx PolicyContext) {
	p.history = append(p.history, ctx)
}

func (p *PolicyLearner) Suggest(env map[string]string) []string {
	var candidates []string
	for _, ctx := range p.history {
		if matchEnvironment(env, ctx.Environment) {
			candidates = append(candidates, strings.Join(ctx.Tags, ","))
		}
	}
	return dedupe(candidates)
}

func (p *PolicyLearner) History() []PolicyContext {
	out := make([]PolicyContext, len(p.history))
	copy(out, p.history)
	return out
}

func matchEnvironment(a, b map[string]string) bool {
	if len(a) == 0 || len(b) == 0 {
		return false
	}
	matches := 0
	for k, v := range a {
		if b[k] == v {
			matches++
		}
	}
	return matches > 0
}

func dedupe(in []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range in {
		if !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	return out
}

package alpgo

import (
	"fmt"
	"strings"
)

type PolicyEngine struct {
	policies []*AlpObject
}

func NewPolicyEngine(objects []*AlpObject) *PolicyEngine {
	var policies []*AlpObject
	for _, obj := range objects {
		if obj.Type == "policy" {
			policies = append(policies, obj)
		}
	}
	return &PolicyEngine{policies: policies}
}

func (e *PolicyEngine) Count() int {
	return len(e.policies)
}

func (e *PolicyEngine) Evaluate(query *PolicyQuery) *PolicyDecision {
	reasons := []string{}
	matchedPolicies := []string{}
	blocked := false
	requiresApproval := false

	for _, policy := range e.policies {
		kind := getStringProperty(policy.Properties, "kind")
		value := getStringProperty(policy.Properties, "value")

		if !matchesPolicy(query, kind, value) {
			continue
		}

		matchedPolicies = append(matchedPolicies, policy.ID)

		if strings.HasPrefix(kind, "deny") || (kind == "deny_path" && query.Kind == "path") || (kind == "deny_command" && query.Kind == "command") {
			blocked = true
			reasons = append(reasons, fmt.Sprintf("Denied by policy: %s", policy.ID))
		} else if kind == "require_approval" {
			requiresApproval = true
			reasons = append(reasons, fmt.Sprintf("Requires approval: %s", policy.ID))
		} else {
			enforcement := getStringProperty(policy.Properties, "enforcement")
			if enforcement == "" {
				enforcement = "strict"
			}
			if enforcement == "warn" {
				reasons = append(reasons, fmt.Sprintf("Warning: %s", policy.ID))
			}
		}
	}

	return &PolicyDecision{
		Allowed:         !blocked,
		Blocked:         blocked,
		Reasons:         reasons,
		Policies:        matchedPolicies,
		RequiresApproval: requiresApproval,
	}
}

func matchesPolicy(query *PolicyQuery, policyKind, policyValue string) bool {
	if policyValue == "" {
		return false
	}
	baseKind := strings.ReplaceAll(strings.ReplaceAll(policyKind, "deny_", ""), "allow_", "")
	if query.Kind != baseKind {
		return false
	}
	if query.Value == nil || *query.Value == "" {
		return false
	}
	queryValue := *query.Value
	if strings.Contains(policyValue, "*") {
		regex := strings.ReplaceAll(strings.ReplaceAll(policyValue, ".", "\\."), "*", ".*")
		return regexMatch(queryValue, regex)
	}
	return queryValue == policyValue || strings.HasPrefix(queryValue, policyValue)
}

func regexMatch(value, pattern string) bool {
	// Simplified regex match using HasPrefix for wildcard patterns
	if strings.HasSuffix(pattern, ".*") {
		prefix := strings.TrimSuffix(pattern, ".*")
		return strings.HasPrefix(value, prefix)
	}
	return value == pattern
}

type PolicyQuery struct {
	Kind  string
	Value *string
	Agent *string
}

func NewPolicyQuery(kind, value string) *PolicyQuery {
	v := value
	return &PolicyQuery{Kind: kind, Value: &v}
}

func (q *PolicyQuery) WithAgent(agent string) *PolicyQuery {
	q.Agent = &agent
	return q
}

type PolicyDecision struct {
	Allowed          bool
	Blocked          bool
	Reasons          []string
	Policies         []string
	RequiresApproval bool
	Audit            map[string]interface{}
}

func getStringProperty(props map[string]any, key string) string {
	v, ok := props[key]
	if !ok {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return s
}

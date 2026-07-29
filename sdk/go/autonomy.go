package alpgo

import (
	"fmt"
	"time"
)

type EditProposal struct {
	ProposalID  string
	WorkflowID  string
	Edits       []map[string]any
	Rationale   string
	Status      string
	CreatedAt   string
	ReviewedAt  *string
	ReviewNote  *string
}

func NewEditProposal(workflowID string, edits []map[string]any, rationale string) *EditProposal {
	proposalID := fmt.Sprintf("prop-%s-%d", workflowID, len(edits)+1)
	createdAt := time.Now().Format(time.RFC3339)
	return &EditProposal{
		ProposalID: proposalID,
		WorkflowID: workflowID,
		Edits:      edits,
		Rationale:  rationale,
		Status:     "pending",
		CreatedAt:  createdAt,
	}
}

func (p *EditProposal) ToDict() map[string]any {
	dict := map[string]any{
		"proposal_id": p.ProposalID,
		"workflow_id": p.WorkflowID,
		"edits":       p.Edits,
		"rationale":   p.Rationale,
		"status":      p.Status,
		"created_at":  p.CreatedAt,
	}
	if p.ReviewedAt != nil {
		dict["reviewed_at"] = *p.ReviewedAt
	}
	if p.ReviewNote != nil {
		dict["review_note"] = *p.ReviewNote
	}
	return dict
}

type WorkflowMutator struct {
	policyEngine     *PolicyEngine
	proposals        map[string]*EditProposal
	rollbackSnapshots map[string]map[string]any
}

func NewWorkflowMutator() *WorkflowMutator {
	return &WorkflowMutator{
		proposals:        make(map[string]*EditProposal),
		rollbackSnapshots: make(map[string]map[string]any),
	}
}

func (w *WorkflowMutator) WithPolicyEngine(engine *PolicyEngine) *WorkflowMutator {
	w.policyEngine = engine
	return w
}

func (w *WorkflowMutator) ProposeEdit(workflowID string, edits []map[string]any, rationale string) *EditProposal {
	proposal := NewEditProposal(workflowID, edits, rationale)
	w.proposals[proposal.ProposalID] = proposal
	return proposal
}

func (w *WorkflowMutator) Approve(proposalID string, workflow map[string]any) (map[string]any, error) {
	proposal, ok := w.proposals[proposalID]
	if !ok {
		return nil, fmt.Errorf("proposal %s not found", proposalID)
	}
	if w.policyEngine != nil {
		_ = w.policyEngine.Evaluate(NewPolicyQuery("edits", proposalID))
	}
	w.rollbackSnapshots[proposalID] = workflow
	updated := workflow
	for _, edit := range proposal.Edits {
		for k, v := range edit {
			updated[k] = v
		}
	}
	proposal.Status = "approved"
	reviewedAt := time.Now().Format(time.RFC3339)
	proposal.ReviewedAt = &reviewedAt
	return updated, nil
}

func (w *WorkflowMutator) Rollback(proposalID string) map[string]any {
	snapshot, ok := w.rollbackSnapshots[proposalID]
	if ok {
		delete(w.rollbackSnapshots, proposalID)
	}
	if proposal, ok := w.proposals[proposalID]; ok {
		proposal.Status = "rolled_back"
	}
	return snapshot
}

func (w *WorkflowMutator) GetProposal(proposalID string) *EditProposal {
	return w.proposals[proposalID]
}

func (w *WorkflowMutator) ListProposals() []*EditProposal {
	result := make([]*EditProposal, 0, len(w.proposals))
	for _, p := range w.proposals {
		result = append(result, p)
	}
	return result
}

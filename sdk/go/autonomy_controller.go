package alpgo

import (
	"fmt"
)

type AutonomyController struct {
	mutator  *WorkflowMutator
	decisions []map[string]string
}

func NewAutonomyController(mutator *WorkflowMutator) *AutonomyController {
	return &AutonomyController{
		mutator:   mutator,
		decisions: []map[string]string{},
	}
}

func (c *AutonomyController) ProposeEdit(workflowID string, edits []map[string]any, rationale string) *EditProposal {
	proposal := c.mutator.ProposeEdit(workflowID, edits, rationale)
	decision := map[string]string{
		"action":      "propose",
		"proposal_id": proposal.ProposalID,
		"note":        proposal.Rationale,
	}
	c.decisions = append(c.decisions, decision)
	return proposal
}

func (c *AutonomyController) ApproveEdit(proposalID string, workflow map[string]any) (map[string]any, error) {
	updated, err := c.mutator.Approve(proposalID, workflow)
	if err != nil {
		return nil, err
	}
	decision := map[string]string{
		"action":      "approve",
		"proposal_id": proposalID,
		"note":        "approved",
	}
	c.decisions = append(c.decisions, decision)
	return updated, nil
}

func (c *AutonomyController) Decisions() []map[string]string {
	return c.decisions
}

func init() {
	fmt.Printf("[alpgo] autonomy_controller initialized\n")
}

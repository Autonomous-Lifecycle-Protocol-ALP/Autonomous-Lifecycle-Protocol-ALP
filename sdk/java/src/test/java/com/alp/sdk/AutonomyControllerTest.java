package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AutonomyControllerTest {

    @Test
    void proposeEdit_createsProposal() {
        WorkflowMutator mutator = new WorkflowMutator();
        AutonomyController controller = new AutonomyController(mutator);

        List<Map<String, Object>> edits = List.of(Map.of("key", "value"));
        EditProposal proposal = controller.proposeEdit("wf-1", edits, "optimize");

        assertEquals("wf-1", proposal.getWorkflowId());
        assertEquals("pending", proposal.getStatus());
    }

    @Test
    void approveEdit_returnsUpdatedWorkflow() {
        WorkflowMutator mutator = new WorkflowMutator();
        AutonomyController controller = new AutonomyController(mutator);

        EditProposal proposal = controller.proposeEdit("wf-1", List.of(Map.of("step", "2")), "rationale");
        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", "wf-1");

        Map<String, Object> updated = controller.approveEdit(proposal.getProposalId(), workflow);
        assertEquals("2", updated.get("step"));
    }

    @Test
    void getDecisions_returnsHistory() {
        WorkflowMutator mutator = new WorkflowMutator();
        AutonomyController controller = new AutonomyController(mutator);

        controller.proposeEdit("wf-1", List.of(), "d1");
        List<Map<String, Object>> decisions = controller.getDecisions();

        assertFalse(decisions.isEmpty());
        assertEquals("propose", decisions.get(0).get("action"));
    }
}

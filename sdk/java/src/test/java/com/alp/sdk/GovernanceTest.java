package com.alp.sdk;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class GovernanceTest {
    private GovernanceEngine engine;

    @BeforeEach
    public void setUp() {
        engine = new GovernanceEngine("/tmp/alp-test-gov", 2);
    }

    @Test
    public void testProposeAndVote() {
        engine.qualify("did:alp:agent-1");
        engine.qualify("did:alp:agent-2");

        BallotRecord ballot = engine.propose("policy-1", "Test policy", 2);
        assertNotNull(ballot.getBallotId());
        assertTrue(ballot.getBallotId().startsWith("ballot-"));
        assertEquals("open", ballot.getStatus());

        Map<String, Object> result = engine.vote(ballot.getBallotId(), "did:alp:agent-1", "approve", "Looks good", "key1");
        assertTrue((Boolean) result.get("accepted"));
    }

    @Test
    public void testRejectsUnqualifiedVoter() {
        BallotRecord ballot = engine.propose("policy-1", "Test", 2);
        Map<String, Object> result = engine.vote(ballot.getBallotId(), "did:alp:unknown", "approve", "", "");
        assertFalse((Boolean) result.get("accepted"));
        assertEquals("voter_not_qualified", result.get("reason"));
    }

    @Test
    public void testRejectsDoubleVote() {
        engine.qualify("did:alp:agent-1");
        BallotRecord ballot = engine.propose("policy-1", "Test", 2);
        engine.vote(ballot.getBallotId(), "did:alp:agent-1", "approve", "", "key1");
        Map<String, Object> result = engine.vote(ballot.getBallotId(), "did:alp:agent-1", "reject", "", "key1");
        assertFalse((Boolean) result.get("accepted"));
        assertEquals("already_voted", result.get("reason"));
    }

    @Test
    public void testCloseAndTally() {
        engine.qualify("did:alp:agent-1");
        engine.qualify("did:alp:agent-2");
        BallotRecord ballot = engine.propose("policy-1", "Test", 2);
        engine.vote(ballot.getBallotId(), "did:alp:agent-1", "approve", "", "key1");
        engine.vote(ballot.getBallotId(), "did:alp:agent-2", "reject", "", "key2");

        GovernanceReport report = engine.closeAndTally(ballot.getBallotId());
        assertEquals("tied", report.getResult());
        assertEquals(2, report.getTally().get("total").intValue());
    }
}

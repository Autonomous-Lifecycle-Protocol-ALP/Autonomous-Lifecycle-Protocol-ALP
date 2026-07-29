package com.alp.sdk;

import java.util.*;

public class GovernanceTest {
    public static void main(String[] args) {
        GovernanceEngine engine = new GovernanceEngine("/tmp/alp-test-gov", 2);
        engine.qualify("did:alp:agent-1");
        engine.qualify("did:alp:agent-2");

        BallotRecord ballot = engine.propose("policy-1", "Test policy", 2);
        System.out.println("Ballot opened: " + ballot.getBallotId());

        Map<String, Object> voteResult = engine.vote(ballot.getBallotId(), "did:alp:agent-1", "approve", "Looks good", "key1");
        System.out.println("Vote accepted: " + voteResult.get("accepted"));

        GovernanceReport report = engine.closeAndTally(ballot.getBallotId());
        System.out.println("Result: " + report.getResult());
        System.out.println("Tally: " + report.getTally());
    }
}

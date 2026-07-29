package com.alp.sdk;

import java.util.*;

public class GovernanceEngine {
    private final String alpDir;
    private final PolicyBallot ballot;
    private final int minQuorum;
    private final Set<String> qualifiedVoters = new LinkedHashSet<>();

    public GovernanceEngine(String alpDir, int minQuorum) {
        this.alpDir = alpDir;
        this.ballot = new PolicyBallot(alpDir);
        this.minQuorum = minQuorum;
    }

    public GovernanceEngine(String alpDir) {
        this(alpDir, 3);
    }

    public void qualify(String voterDid) {
        qualifiedVoters.add(voterDid);
    }

    public void disqualify(String voterDid) {
        qualifiedVoters.remove(voterDid);
    }

    public BallotRecord propose(String policyId, String description, Integer quorum) {
        int effectiveQuorum = quorum != null ? Math.max(quorum, Math.floorDiv(qualifiedVoters.size(), 2) + 1) : Math.max(minQuorum, Math.floorDiv(qualifiedVoters.size(), 2) + 1);
        return ballot.openBallot(policyId, description, effectiveQuorum);
    }

    public Map<String, Object> vote(String ballotId, String voterDid, String value, String rationale, String privateKey) {
        if (!qualifiedVoters.contains(voterDid)) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accepted", false);
            result.put("reason", "voter_not_qualified");
            return result;
        }
        BallotRecord ballotRecord = ballot.getBallot(ballotId);
        if (ballotRecord == null || !"open".equals(ballotRecord.getStatus())) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accepted", false);
            result.put("reason", "ballot_not_open");
            return result;
        }
        boolean alreadyVoted = ballotRecord.getVotes().stream().anyMatch(v -> voterDid.equals(v.getVoterDid()));
        if (alreadyVoted) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accepted", false);
            result.put("reason", "already_voted");
            return result;
        }
        Vote vote = ballot.castVote(ballotId, voterDid, value, rationale, privateKey);
        if (vote == null) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accepted", false);
            result.put("reason", "cast_failed");
            return result;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accepted", true);
        result.put("vote", vote.toDict());
        return result;
    }

    public GovernanceReport closeAndTally(String ballotId) {
        BallotRecord ballotRecord = ballot.closeBallot(ballotId);
        if (ballotRecord == null) {
            throw new AlpError("Ballot '" + ballotId + "' not found or already closed.");
        }
        return tallyBallot(ballotRecord);
    }

    public GovernanceReport getReport(String ballotId) {
        BallotRecord ballotRecord = ballot.getBallot(ballotId);
        if (ballotRecord == null || !"closed".equals(ballotRecord.getStatus())) return null;
        return tallyBallot(ballotRecord);
    }

    public List<BallotRecord> listBallots() {
        return ballot.listBallots();
    }

    private GovernanceReport tallyBallot(BallotRecord ballotRecord) {
        Map<String, Integer> tally = ballotRecord.tally();
        int total = tally.getOrDefault("total", 0);
        String result;
        if (total < ballotRecord.getQuorum()) {
            result = "quorum_not_met";
        } else if (tally.getOrDefault("approve", 0) > tally.getOrDefault("reject", 0)) {
            result = "approved";
        } else if (tally.getOrDefault("reject", 0) > tally.getOrDefault("approve", 0)) {
            result = "rejected";
        } else {
            result = "tied";
        }
        return new GovernanceReport(ballotRecord.getBallotId(), result, tally, ballotRecord.getCreatedAt(), ballotRecord.getClosedAt());
    }
}

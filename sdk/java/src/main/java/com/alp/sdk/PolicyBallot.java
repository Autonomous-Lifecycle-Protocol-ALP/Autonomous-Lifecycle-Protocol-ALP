package com.alp.sdk;

import java.util.*;
import java.nio.file.*;

public class PolicyBallot {
    private final String alpDir;
    private final Map<String, BallotRecord> ballots = new LinkedHashMap<>();

    public PolicyBallot(String alpDir) {
        this.alpDir = alpDir;
        load();
    }

    private String ballotsPath() {
        return Path.of(alpDir, ".governance", "ballots.jsonl").toString();
    }

    public void load() {
        Path p = Path.of(ballotsPath());
        if (!Files.exists(p)) return;
        try {
            List<String> lines = Files.readAllLines(p);
            for (String line : lines) {
                if (line.trim().isEmpty()) continue;
                Map<String, Object> entry = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(line, new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, Object>>() {});
                String ballotId = (String) entry.get("ballot_id");
                String policyId = (String) entry.get("policy_id");
                String description = (String) entry.get("description");
                List<Map<String, Object>> voteDicts = (List<Map<String, Object>>) entry.get("votes");
                List<Vote> votes = new ArrayList<>();
                if (voteDicts != null) {
                    for (Map<String, Object> vd : voteDicts) {
                        votes.add(new Vote(
                            (String) vd.get("voter_did"),
                            (String) vd.get("ballot_id"),
                            (String) vd.get("value"),
                            (String) vd.get("rationale"),
                            (String) vd.get("timestamp"),
                            (String) vd.get("signature")
                        ));
                    }
                }
                String status = (String) entry.getOrDefault("status", "open");
                int quorum = entry.get("quorum") instanceof Integer ? (Integer) entry.get("quorum") : 3;
                String createdAt = (String) entry.getOrDefault("created_at", "");
                String closedAt = (String) entry.getOrDefault("closed_at", "");
                BallotRecord ballot = new BallotRecord(ballotId, policyId, description, votes, status, quorum, createdAt, closedAt);
                ballots.put(ballotId, ballot);
            }
        } catch (Exception e) {
            ballots.clear();
        }
    }

    private void saveBallot(BallotRecord ballot) {
        try {
            Path d = Path.of(alpDir, ".governance");
            if (!Files.exists(d)) {
                Files.createDirectories(d);
            }
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(ballot.toDict());
            Files.writeString(Path.of(ballotsPath()), json + "\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception e) {
            throw new AlpError("Failed to save ballot: " + e.getMessage());
        }
    }

    public BallotRecord openBallot(String policyId, String description, int quorum) {
        String ballotId = "ballot-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        BallotRecord ballot = new BallotRecord(ballotId, policyId, description, new ArrayList<>(), "open", quorum, "", "");
        ballots.put(ballotId, ballot);
        saveBallot(ballot);
        return ballot;
    }

    public Vote castVote(String ballotId, String voterDid, String value, String rationale, String privateKey) {
        BallotRecord ballot = ballots.get(ballotId);
        if (ballot == null || !"open".equals(ballot.getStatus())) return null;
        Vote vote = new Vote(voterDid, ballotId, value, rationale, new Date().toString(), "");
        if (privateKey != null && !privateKey.isEmpty()) {
            vote.sign(privateKey);
        }
        ballot.getVotes().add(vote);
        saveBallot(ballot);
        return vote;
    }

    public BallotRecord closeBallot(String ballotId) {
        BallotRecord ballot = ballots.get(ballotId);
        if (ballot == null || !"open".equals(ballot.getStatus())) return null;
        ballot.setStatus("closed");
        ballot.setClosedAt(new Date().toString());
        saveBallot(ballot);
        return ballot;
    }

    public BallotRecord getBallot(String ballotId) {
        return ballots.get(ballotId);
    }

    public List<BallotRecord> listBallots() {
        return new ArrayList<>(ballots.values());
    }
}

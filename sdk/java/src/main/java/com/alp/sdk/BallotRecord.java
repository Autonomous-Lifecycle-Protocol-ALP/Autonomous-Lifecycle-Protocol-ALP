package com.alp.sdk;

import java.util.*;
import java.nio.file.*;

public class BallotRecord {
    private String ballotId;
    private String policyId;
    private String description;
    private List<Vote> votes;
    private String status;
    private int quorum;
    private String createdAt;
    private String closedAt;

    public BallotRecord(String ballotId, String policyId, String description, List<Vote> votes, String status, int quorum, String createdAt, String closedAt) {
        this.ballotId = ballotId;
        this.policyId = policyId;
        this.description = description;
        this.votes = votes != null ? votes : new ArrayList<>();
        this.status = status != null ? status : "open";
        this.quorum = quorum;
        this.createdAt = createdAt != null ? createdAt : new Date().toString();
        this.closedAt = closedAt != null ? closedAt : "";
    }

    public String getBallotId() { return ballotId; }
    public String getPolicyId() { return policyId; }
    public String getDescription() { return description; }
    public List<Vote> getVotes() { return votes; }
    public String getStatus() { return status; }
    public int getQuorum() { return quorum; }
    public String getCreatedAt() { return createdAt; }
    public String getClosedAt() { return closedAt; }
    public void setStatus(String status) { this.status = status; }
    public void setClosedAt(String closedAt) { this.closedAt = closedAt; }

    public Map<String, Object> toDict() {
        Map<String, Object> dict = new LinkedHashMap<>();
        dict.put("ballot_id", ballotId);
        dict.put("policy_id", policyId);
        dict.put("description", description);
        List<Map<String, Object>> voteDicts = new ArrayList<>();
        for (Vote v : votes) {
            voteDicts.add(v.toDict());
        }
        dict.put("votes", voteDicts);
        dict.put("status", status);
        dict.put("quorum", quorum);
        dict.put("created_at", createdAt);
        dict.put("closed_at", closedAt);
        return dict;
    }

    public Map<String, Integer> tally() {
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("approve", 0);
        counts.put("reject", 0);
        counts.put("abstain", 0);
        for (Vote v : votes) {
            String val = v.getValue();
            if (!counts.containsKey(val)) {
                counts.put(val, 0);
            }
            counts.put(val, counts.get(val) + 1);
        }
        counts.put("total", votes.size());
        return counts;
    }
}

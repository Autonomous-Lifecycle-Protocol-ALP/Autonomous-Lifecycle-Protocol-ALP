package com.alp.sdk;

import java.util.*;
import java.nio.file.*;
import java.security.MessageDigest;

public class GovernanceReport {
    private String ballotId;
    private String result;
    private Map<String, Integer> tally;
    private String startedAt;
    private String finishedAt;

    public GovernanceReport(String ballotId, String result, Map<String, Integer> tally, String startedAt, String finishedAt) {
        this.ballotId = ballotId;
        this.result = result;
        this.tally = tally != null ? tally : new LinkedHashMap<>();
        this.startedAt = startedAt != null ? startedAt : new Date().toString();
        this.finishedAt = finishedAt != null ? finishedAt : new Date().toString();
    }

    public String getBallotId() { return ballotId; }
    public String getResult() { return result; }
    public Map<String, Integer> getTally() { return tally; }
    public String getStartedAt() { return startedAt; }
    public String getFinishedAt() { return finishedAt; }

    public Map<String, Object> toDict() {
        Map<String, Object> dict = new LinkedHashMap<>();
        dict.put("ballot_id", ballotId);
        dict.put("result", result);
        dict.put("tally", tally);
        dict.put("started_at", startedAt);
        dict.put("finished_at", finishedAt);
        return dict;
    }
}

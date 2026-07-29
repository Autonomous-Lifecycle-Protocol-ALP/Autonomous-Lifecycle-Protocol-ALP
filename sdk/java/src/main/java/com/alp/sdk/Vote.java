package com.alp.sdk;

import java.util.*;
import java.nio.file.*;

public class Vote {
    private String voterDid;
    private String ballotId;
    private String value;
    private String rationale;
    private String timestamp;
    private String signature;

    public Vote(String voterDid, String ballotId, String value, String rationale, String timestamp, String signature) {
        this.voterDid = voterDid;
        this.ballotId = ballotId;
        this.value = value;
        this.rationale = rationale != null ? rationale : "";
        this.timestamp = timestamp != null ? timestamp : new Date().toString();
        this.signature = signature != null ? signature : "";
    }

    public String getVoterDid() { return voterDid; }
    public String getBallotId() { return ballotId; }
    public String getValue() { return value; }
    public String getRationale() { return rationale; }
    public String getTimestamp() { return timestamp; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public Map<String, Object> toDict() {
        Map<String, Object> dict = new LinkedHashMap<>();
        dict.put("voter_did", voterDid);
        dict.put("ballot_id", ballotId);
        dict.put("value", value);
        dict.put("rationale", rationale);
        dict.put("timestamp", timestamp);
        dict.put("signature", signature);
        return dict;
    }

    public String sign(String privateKey) {
        try {
            Map<String, Object> payloadMap = new LinkedHashMap<>();
            payloadMap.put("ballot_id", ballotId);
            payloadMap.put("rationale", rationale);
            payloadMap.put("timestamp", timestamp);
            payloadMap.put("value", value);
            payloadMap.put("voter_did", voterDid);
            String payload = new com.fasterxml.jackson.databind.ObjectMapper()
                .writeValueAsString(payloadMap);
            this.signature = SigningUtils.sha256(payload + privateKey);
            return this.signature;
        } catch (Exception e) {
            throw new AlpError("Failed to sign vote: " + e.getMessage());
        }
    }
}

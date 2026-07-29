package com.alp.sdk;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

public class VerifiablePresentation {
    private String did;
    private String agentId;
    private Map<String, Object> claims;
    private String signature;
    private String issuedAt;

    public VerifiablePresentation(String did, String agentId, Map<String, Object> claims, String signature) {
        this(did, agentId, claims, signature, "");
    }

    public VerifiablePresentation(String did, String agentId, Map<String, Object> claims, String signature, String issuedAt) {
        this.did = did;
        this.agentId = agentId;
        this.claims = claims != null ? claims : new LinkedHashMap<>();
        this.signature = signature;
        this.issuedAt = issuedAt.isEmpty() ? new Date().toString() : issuedAt;
    }

    public String getDid() { return did; }
    public String getAgentId() { return agentId; }
    public Map<String, Object> getClaims() { return claims; }
    public String getSignature() { return signature; }
    public String getIssuedAt() { return issuedAt; }

    public Map<String, Object> toDict() {
        Map<String, Object> dict = new LinkedHashMap<>();
        dict.put("did", did);
        dict.put("agent_id", agentId);
        dict.put("claims", claims);
        dict.put("signature", signature);
        dict.put("issued_at", issuedAt);
        return dict;
    }

    public boolean verify(String publicKey) {
        try {
            StringBuilder payload = new StringBuilder();
            payload.append("{\"did\":\"").append(did).append("\",\"agent_id\":\"").append(agentId).append("\",\"claims\":");
            payload.append(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(claims));
            payload.append("}");
            String expected = sha256(payload.toString() + publicKey);
            return signature.equals(expected);
        } catch (Exception e) {
            return false;
        }
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new AlpError("SHA-256 not available");
        }
    }
}

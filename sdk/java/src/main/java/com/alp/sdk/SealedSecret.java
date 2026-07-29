package com.alp.sdk;

import java.util.*;

public class SealedSecret {
    private String id;
    private List<String> recipients;
    private String nonce;
    private String ciphertext;
    private String createdAt;
    private String rotatedAt;

    public SealedSecret() {}

    public SealedSecret(String id, List<String> recipients, String nonce, String ciphertext) {
        this.id = id;
        this.recipients = recipients;
        this.nonce = nonce;
        this.ciphertext = ciphertext;
        this.createdAt = new Date().toString();
    }

    public String getId() { return id; }
    public SealedSecret setId(String id) { this.id = id; return this; }
    public List<String> getRecipients() { return recipients; }
    public SealedSecret setRecipients(List<String> recipients) { this.recipients = recipients; return this; }
    public String getNonce() { return nonce; }
    public SealedSecret setNonce(String nonce) { this.nonce = nonce; return this; }
    public String getCiphertext() { return ciphertext; }
    public SealedSecret setCiphertext(String ciphertext) { this.ciphertext = ciphertext; return this; }
    public String getCreatedAt() { return createdAt; }
    public SealedSecret setCreatedAt(String createdAt) { this.createdAt = createdAt; return this; }
    public String getRotatedAt() { return rotatedAt; }
    public SealedSecret setRotatedAt(String rotatedAt) { this.rotatedAt = rotatedAt; return this; }
}

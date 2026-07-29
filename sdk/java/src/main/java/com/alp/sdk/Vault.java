package com.alp.sdk;

import java.util.*;

public class Vault {
    private final Map<String, SealedSecret> secrets = new LinkedHashMap<>();
    private final List<VaultAuditEntry> audit = new ArrayList<>();

    public void setSecret(String id, String value, List<String> recipients) {
        SealedSecret secret = new SealedSecret(id, recipients, UUID.randomUUID().toString(), value);
        secrets.put(id, secret);
        audit.add(new VaultAuditEntry(System.currentTimeMillis() + "", "set", id));
    }

    public String getSecret(String id) {
        SealedSecret secret = secrets.get(id);
        if (secret == null) {
            throw new AlpError("Secret not found: " + id);
        }
        audit.add(new VaultAuditEntry(System.currentTimeMillis() + "", "get", id));
        return secret.getCiphertext();
    }

    public List<String> listSecrets() {
        return new ArrayList<>(secrets.keySet());
    }

    public List<VaultAuditEntry> getAudit() {
        return new ArrayList<>(audit);
    }
}

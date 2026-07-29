package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class VaultTest {

    @Test
    void setAndGetSecret_roundTrips() {
        Vault vault = new Vault();
        vault.setSecret("api-key", "secret-value", List.of("recipient-1"));

        assertEquals("secret-value", vault.getSecret("api-key"));
        assertTrue(vault.listSecrets().contains("api-key"));
    }

    @Test
    void getSecret_missing_throws() {
        Vault vault = new Vault();
        assertThrows(AlpError.class, () -> vault.getSecret("missing"));
    }

    @Test
    void audit_recordsActions() {
        Vault vault = new Vault();
        vault.setSecret("k1", "v1", List.of());
        vault.getSecret("k1");

        List<VaultAuditEntry> audit = vault.getAudit();
        assertTrue(audit.size() >= 2);
    }
}

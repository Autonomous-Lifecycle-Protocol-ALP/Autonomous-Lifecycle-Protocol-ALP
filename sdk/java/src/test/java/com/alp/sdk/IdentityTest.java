package com.alp.sdk;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class IdentityTest {
    private KeyPair kp;
    private String did;

    @BeforeEach
    public void setUp() {
        kp = SigningUtils.generateKeypair();
        did = SigningUtils.createDid("agent-1", kp.getPublicKey());
    }

    @Test
    public void testGenerateKeypair() {
        assertNotNull(kp.getPublicKey());
        assertNotNull(kp.getPrivateKey());
        assertFalse(kp.getPublicKey().isEmpty());
        assertFalse(kp.getPrivateKey().isEmpty());
    }

    @Test
    public void testCreateDid() {
        assertTrue(did.startsWith("did:alp:agent-1:"));
    }

    @Test
    public void testAgentIdentityToDict() {
        AgentIdentity identity = new AgentIdentity(did, "agent-1", kp.getPublicKey());
        Map<String, Object> dict = identity.toDict();
        assertEquals(did, dict.get("did"));
        assertEquals("agent-1", dict.get("agent_id"));
        assertEquals(kp.getPublicKey(), dict.get("public_key"));
    }

    @Test
    public void testVerifiablePresentationVerify() {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("role", "admin");
        VerifiablePresentation vp = new VerifiablePresentation(did, "agent-1", claims, "");
        String payload = "{\"did\":\"" + did + "\",\"agent_id\":\"agent-1\",\"claims\":" + claims + "}";
        String signature = SigningUtils.sha256(payload + kp.getPublicKey());
        vp = new VerifiablePresentation(did, "agent-1", claims, signature);
        assertTrue(vp.verify(kp.getPublicKey()));
    }

    @Test
    public void testTrustRegistryRegisterResolve() {
        TrustRegistry registry = new TrustRegistry("/tmp/alp-test");
        TrustEntry entry = registry.register(did, "agent-1", Arrays.asList("read", "write"), "trusted");
        assertEquals("agent-1", entry.getAgentId());
        assertTrue(entry.getScopes().contains("read"));
        assertTrue(registry.hasScope(did, "read"));
    }

    @Test
    public void testTrustRegistryRevoke() {
        TrustRegistry registry = new TrustRegistry("/tmp/alp-test");
        registry.register(did, "agent-1", Arrays.asList("read"), "trusted");
        assertTrue(registry.revoke(did));
        assertFalse(registry.hasScope(did, "read"));
    }

    @Test
    public void testAgentKeyStore() {
        AgentKeyStore store = new AgentKeyStore("/tmp/alp-test-keys");
        store.storeKey(did, kp.getPublicKey(), kp.getPrivateKey());
        KeyPair retrieved = store.getKey(did);
        assertEquals(kp.getPublicKey(), retrieved.getPublicKey());
        assertEquals(kp.getPrivateKey(), retrieved.getPrivateKey());
        assertTrue(store.removeKey(did));
        assertNull(store.getKey(did));
    }
}

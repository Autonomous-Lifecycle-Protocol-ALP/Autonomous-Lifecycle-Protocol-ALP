package com.alp.sdk;

import java.util.*;

public class IdentityTest {
    public static void main(String[] args) {
        KeyPair kp = SigningUtils.generateKeypair();
        System.out.println("Generated keypair: public=" + kp.getPublicKey().substring(0, 16) + "...");

        String did = SigningUtils.createDid("agent-1", kp.getPublicKey());
        System.out.println("DID: " + did);

        AgentIdentity identity = new AgentIdentity(did, "agent-1", kp.getPublicKey());
        System.out.println("Identity dict: " + identity.toDict());

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("role", "admin");
        VerifiablePresentation vp = new VerifiablePresentation(did, "agent-1", claims, "");
        vp = new VerifiablePresentation(did, "agent-1", claims, SigningUtils.sha256("{\"did\":\"" + did + "\",\"agent_id\":\"agent-1\",\"claims\":" + claims + "}" + kp.getPrivateKey()));
        System.out.println("VP signature valid: " + vp.verify(kp.getPublicKey()));

        TrustRegistry registry = new TrustRegistry("/tmp/alp-test");
        registry.register(did, "agent-1", Arrays.asList("read", "write"), "trusted");

        IdentityResolver resolver = new IdentityResolver(registry);
        Map<String, Object> result = resolver.verifyPresentation(vp, kp.getPublicKey());
        System.out.println("Verification result: " + result);
    }
}

package com.alp.sdk;

import java.util.*;
import java.nio.file.*;

public class IdentityResolver {
    private final TrustRegistry trustRegistry;

    public IdentityResolver(TrustRegistry trustRegistry) {
        this.trustRegistry = trustRegistry;
    }

    public Map<String, Object> verifyPresentation(VerifiablePresentation presentation, String publicKey) {
        if (!presentation.verify(publicKey)) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("valid", false);
            result.put("reason", "invalid_signature");
            return result;
        }
        TrustEntry entry = trustRegistry.resolve(presentation.getDid());
        if (entry == null) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("valid", false);
            result.put("reason", "unknown_did");
            return result;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("valid", true);
        result.put("did", presentation.getDid());
        result.put("agent_id", presentation.getAgentId());
        result.put("scopes", entry.getScopes());
        result.put("trust_level", entry.getTrustLevel());
        return result;
    }
}

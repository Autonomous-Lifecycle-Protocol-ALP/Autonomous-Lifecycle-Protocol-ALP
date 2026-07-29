package com.alp.sdk;

import java.util.*;
import java.nio.file.*;

public class TrustRegistry {
    private final String alpDir;
    private Map<String, TrustEntry> entries = new LinkedHashMap<>();

    public TrustRegistry(String alpDir) {
        this.alpDir = alpDir;
        load();
    }

    private String identityDir() {
        return Path.of(alpDir, ".identity").toString();
    }

    private String trustPath() {
        return Path.of(identityDir(), "trust_registry.json").toString();
    }

    public void load() {
        Path p = Path.of(trustPath());
        if (!Files.exists(p)) return;
        try {
            String content = new String(Files.readAllBytes(p));
            if (content != null && !content.isEmpty()) {
                entries = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(content, new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, TrustEntry>>() {});
            }
        } catch (Exception e) {
            entries = new LinkedHashMap<>();
        }
    }

    public void save() {
        try {
            Path d = Path.of(identityDir());
            if (!Files.exists(d)) {
                Files.createDirectories(d);
            }
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(entries);
            Files.writeString(Path.of(trustPath()), json);
        } catch (Exception e) {
            throw new AlpError("Failed to save trust registry: " + e.getMessage());
        }
    }

    public TrustEntry register(String did, String agentId, List<String> scopes, String trustLevel) {
        TrustEntry entry = new TrustEntry(agentId, scopes, trustLevel != null ? trustLevel : "standard", new Date().toString());
        entries.put(did, entry);
        save();
        return entry;
    }

    public TrustEntry resolve(String did) {
        return entries.get(did);
    }

    public boolean revoke(String did) {
        if (entries.containsKey(did)) {
            entries.remove(did);
            save();
            return true;
        }
        return false;
    }

    public List<String> listDids() {
        return new ArrayList<>(entries.keySet());
    }

    public boolean hasScope(String did, String requiredScope) {
        TrustEntry entry = entries.get(did);
        if (entry == null) return false;
        return entry.getScopes().contains(requiredScope);
    }
}

package com.alp.sdk;

import java.util.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class AgentKeyStore {
    private final String alpDir;
    private Map<String, KeyPair> keys = new LinkedHashMap<>();

    public AgentKeyStore(String alpDir) {
        this.alpDir = alpDir;
        load();
    }

    private String identityDir() {
        return Path.of(alpDir, ".identity").toString();
    }

    private String keysPath() {
        return Path.of(identityDir(), "agent_keys.json").toString();
    }

    public void load() {
        Path p = Path.of(keysPath());
        if (!Files.exists(p)) return;
        try {
            String content = new String(Files.readAllBytes(p));
            if (content != null && !content.isEmpty()) {
                keys = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(content, new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, KeyPair>>() {});
            }
        } catch (Exception e) {
            keys = new LinkedHashMap<>();
        }
    }

    public void save() {
        try {
            Path d = Path.of(identityDir());
            if (!Files.exists(d)) {
                Files.createDirectories(d);
            }
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(keys);
            Files.writeString(Path.of(keysPath()), json);
        } catch (Exception e) {
            throw new AlpError("Failed to save agent keys: " + e.getMessage());
        }
    }

    public void storeKey(String did, String publicKey, String privateKey) {
        KeyPair pair = new KeyPair(publicKey, privateKey);
        keys.put(did, pair);
        save();
    }

    public KeyPair getKey(String did) {
        return keys.get(did);
    }

    public boolean removeKey(String did) {
        if (keys.containsKey(did)) {
            keys.remove(did);
            save();
            return true;
        }
        return false;
    }
}

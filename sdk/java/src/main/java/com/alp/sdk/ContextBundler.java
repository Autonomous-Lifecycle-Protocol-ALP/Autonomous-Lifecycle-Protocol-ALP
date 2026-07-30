package com.alp.sdk;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

/**
 * Context Bundler for ALP v46.0.0.
 * Compiles topological context objects into edge-ready bundles.
 */
public class ContextBundler {

    public static class ContextBundle {
        private final String id;
        private final String format;
        private final int objectCount;
        private final String payload;
        private final int sizeBytes;
        private final String checksum;
        private final double compilationMs;
        private final String compiledAt;

        public ContextBundle(String id, String format, int objectCount, String payload, int sizeBytes, String checksum, double compilationMs) {
            this.id = id;
            this.format = format;
            this.objectCount = objectCount;
            this.payload = payload;
            this.sizeBytes = sizeBytes;
            this.checksum = checksum;
            this.compilationMs = compilationMs;
            this.compiledAt = Instant.now().toString();
        }

        public String getId() { return id; }
        public String getFormat() { return format; }
        public int getObjectCount() { return objectCount; }
        public String getPayload() { return payload; }
        public int getSizeBytes() { return sizeBytes; }
        public String getChecksum() { return checksum; }
        public double getCompilationMs() { return compilationMs; }
        public String getCompiledAt() { return compiledAt; }
    }

    public ContextBundle compile(List<AlpObject> objects, String bundleId, String format) {
        long start = System.nanoTime();
        String bId = (bundleId != null && !bundleId.isEmpty()) ? bundleId : "bundle-" + System.currentTimeMillis();
        String fmt = (format != null && !format.isEmpty()) ? format : "json";
        
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < objects.size(); i++) {
            sb.append("{\"id\":\"").append(objects.get(i).getId()).append("\",\"type\":\"").append(objects.get(i).getType()).append("\"}");
            if (i < objects.size() - 1) sb.append(",");
        }
        sb.append("]");

        String payload = sb.toString();
        byte[] payloadBytes = payload.getBytes();
        double compMs = (System.nanoTime() - start) / 1_000_000.0;
        String checksum = "cksum_" + sha256(payload).substring(0, 8);

        return new ContextBundle(bId, fmt, objects.size(), payload, payloadBytes.length, checksum, compMs);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(input.hashCode());
        }
    }
}

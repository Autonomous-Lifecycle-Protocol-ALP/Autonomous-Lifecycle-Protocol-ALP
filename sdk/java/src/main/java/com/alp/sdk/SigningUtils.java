package com.alp.sdk;

import java.util.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

public class SigningUtils {
    public static KeyPair generateKeypair() {
        String privateKey = UUID.randomUUID().toString().replace("-", "");
        String publicKey = sha256(privateKey);
        return new KeyPair(publicKey, privateKey);
    }

    public static String createDid(String agentId, String publicKey) {
        String keyHash = sha256(publicKey).substring(0, 16);
        return "did:alp:" + agentId + ":" + keyHash;
    }

    public static String sha256(String input) {
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

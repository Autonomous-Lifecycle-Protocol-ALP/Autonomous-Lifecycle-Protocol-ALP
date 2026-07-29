package com.alp.sdk;

import java.util.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class KeyPair {
    private String publicKey;
    private String privateKey;

    public KeyPair(String publicKey, String privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    public String getPublicKey() { return publicKey; }
    public String getPrivateKey() { return privateKey; }
}

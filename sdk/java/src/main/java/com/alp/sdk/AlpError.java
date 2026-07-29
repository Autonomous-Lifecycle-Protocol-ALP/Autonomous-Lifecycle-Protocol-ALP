package com.alp.sdk;

public class AlpError extends RuntimeException {
    public AlpError(String message) {
        super(message);
    }

    public AlpError(String message, Throwable cause) {
        super(message, cause);
    }
}

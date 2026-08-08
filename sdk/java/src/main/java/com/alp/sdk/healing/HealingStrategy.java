package com.alp.sdk.healing;

public enum HealingStrategy {
    RETRY("retry"),
    SKIP("skip"),
    ROLLBACK("rollback"),
    ESCALATE("escalate");

    private final String value;

    HealingStrategy(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}

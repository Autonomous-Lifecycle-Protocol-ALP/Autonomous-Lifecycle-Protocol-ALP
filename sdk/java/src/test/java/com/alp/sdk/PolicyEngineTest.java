package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class PolicyEngineTest {

    @Test
    void evaluate_allows_when_no_match() {
        AlpObject policy = new AlpObject("p1", "policy");
        policy.setProperty("kind", "path");
        policy.setProperty("value", "/secret");

        PolicyEngine engine = new PolicyEngine(List.of(policy));
        PolicyDecision decision = engine.evaluate(new PolicyQuery("command", "npm test"));

        assertTrue(decision.isAllowed());
        assertFalse(decision.isBlocked());
    }

    @Test
    void evaluate_blocks_deny_path() {
        AlpObject policy = new AlpObject("p1", "policy");
        policy.setProperty("kind", "deny_path");
        policy.setProperty("value", "/etc/passwd");

        PolicyEngine engine = new PolicyEngine(List.of(policy));
        PolicyDecision decision = engine.evaluate(new PolicyQuery("path", "/etc/passwd"));

        assertFalse(decision.isAllowed());
        assertTrue(decision.isBlocked());
        assertTrue(decision.getReasons().size() > 0);
    }

    @Test
    void evaluate_requires_approval() {
        AlpObject policy = new AlpObject("p1", "policy");
        policy.setProperty("kind", "require_approval");
        policy.setProperty("value", "rm -rf /");

        PolicyEngine engine = new PolicyEngine(List.of(policy));
        PolicyDecision decision = engine.evaluate(new PolicyQuery("command", "rm -rf /"));

        assertTrue(decision.requiresApproval());
        assertTrue(decision.getReasons().size() > 0);
    }
}

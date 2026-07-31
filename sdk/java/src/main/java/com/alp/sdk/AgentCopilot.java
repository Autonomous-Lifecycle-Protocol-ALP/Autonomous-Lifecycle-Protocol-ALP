package com.alp.sdk;

/**
 * AgentCopilot for ALP v62.0.0.
 * Adaptive context-aware AI pair-programmer with intent classification and multi-step planning.
 */
public class AgentCopilot {

    public static class CopilotPlan {
        private final String planId;
        private final String intent;
        private final String prompt;
        private final int steps;

        public CopilotPlan(String planId, String intent, String prompt, int steps) {
            this.planId = planId;
            this.intent = intent;
            this.prompt = prompt;
            this.steps = steps;
        }

        public String getPlanId() { return planId; }
        public String getIntent() { return intent; }
        public String getPrompt() { return prompt; }
        public int getSteps() { return steps; }
    }

    public String classifyIntent(String prompt) {
        String p = prompt.toLowerCase();
        if (p.contains("generate") || p.contains("create") || p.contains("write")) return "CODE_GEN";
        if (p.contains("refactor") || p.contains("improve") || p.contains("clean")) return "REFACTOR";
        if (p.contains("debug") || p.contains("fix") || p.contains("error")) return "DEBUG";
        if (p.contains("explain") || p.contains("what does") || p.contains("how does")) return "EXPLAIN";
        if (p.contains("delegate") || p.contains("assign")) return "DELEGATE";
        return "PLAN";
    }

    public CopilotPlan generatePlan(String prompt) {
        String intent = classifyIntent(prompt);
        String planId = "copilot-plan-" + prompt.length();
        return new CopilotPlan(planId, intent, prompt, 3);
    }
}

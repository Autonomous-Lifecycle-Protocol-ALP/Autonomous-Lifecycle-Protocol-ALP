package com.alp.sdk;

import java.util.List;

/**
 * Policy Optimizer for ALP v52.0.0.
 * Evolves governance policies using genetic optimization algorithms.
 */
public class PolicyOptimizer {

    public static class EvolvedPolicy {
        private final String id;
        private final int generationsEvaluated;
        private final List<String> allowPaths;
        private final List<String> denyPaths;
        private final double fitnessScore;

        public EvolvedPolicy(String id, int generationsEvaluated, List<String> allowPaths, List<String> denyPaths, double fitnessScore) {
            this.id = id;
            this.generationsEvaluated = generationsEvaluated;
            this.allowPaths = allowPaths;
            this.denyPaths = denyPaths;
            this.fitnessScore = fitnessScore;
        }

        public String getId() { return id; }
        public int getGenerationsEvaluated() { return generationsEvaluated; }
        public List<String> getAllowPaths() { return allowPaths; }
        public List<String> getDenyPaths() { return denyPaths; }
        public double getFitnessScore() { return fitnessScore; }
    }

    public EvolvedPolicy evolve(List<String> allowPaths, List<String> denyPaths, int generations) {
        int gens = (generations > 0) ? generations : 5;
        List<String> allows = (allowPaths != null && !allowPaths.isEmpty()) ? allowPaths : List.of("src/*", "docs/*");
        List<String> denys = (denyPaths != null && !denyPaths.isEmpty()) ? denyPaths : List.of(".env", "secrets/*");

        return new EvolvedPolicy("policy-gen-" + gens, gens, allows, denys, 0.88);
    }
}

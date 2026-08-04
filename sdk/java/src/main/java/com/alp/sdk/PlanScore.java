package com.alp.sdk;

public class PlanScore {
    private int nodeCount;
    private int depth;
    private double risk;
    private String confidence;
    private double complexity;
    private double composite;

    public PlanScore(int nodeCount, int depth, double risk, String confidence, double complexity, double composite) {
        this.nodeCount = nodeCount;
        this.depth = depth;
        this.risk = risk;
        this.confidence = confidence;
        this.complexity = complexity;
        this.composite = composite;
    }

    public int getNodeCount() { return nodeCount; }
    public int getDepth() { return depth; }
    public double getRisk() { return risk; }
    public String getConfidence() { return confidence; }
    public double getComplexity() { return complexity; }
    public double getComposite() { return composite; }
}

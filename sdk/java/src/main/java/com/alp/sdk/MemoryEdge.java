package com.alp.sdk;

public class MemoryEdge {
    private String source;
    private String target;
    private double weight;
    private String relation;

    public MemoryEdge(String source, String target, double weight, String relation) {
        this.source = source;
        this.target = target;
        this.weight = weight;
        this.relation = relation;
    }

    public String getSource() { return source; }
    public String getTarget() { return target; }
    public double getWeight() { return weight; }
    public String getRelation() { return relation; }
}

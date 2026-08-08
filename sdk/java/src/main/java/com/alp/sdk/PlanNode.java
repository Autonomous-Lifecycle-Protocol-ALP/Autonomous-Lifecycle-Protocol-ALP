package com.alp.sdk;

import java.util.*;

public class PlanNode {
    private String id;
    private String kind;
    private String label;
    private List<String> dependsOn;

    public PlanNode(String id, String kind, String label, List<String> dependsOn) {
        this.id = id;
        this.kind = kind;
        this.label = label;
        this.dependsOn = dependsOn != null ? dependsOn : new ArrayList<>();
    }

    public String getId() { return id; }
    public String getKind() { return kind; }
    public String getLabel() { return label; }
    public List<String> getDependsOn() { return dependsOn; }
}

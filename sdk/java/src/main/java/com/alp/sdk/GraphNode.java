package com.alp.sdk;

public class GraphNode {
    private String id;
    private String type;

    public GraphNode(String id, String type) {
        this.id = id;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    @Override
    public String toString() {
        return "GraphNode{id='" + id + "', type='" + type + "'}";
    }
}

package com.alp.sdk;

import java.util.*;

public class SemanticGraph {
    private final Map<String, MemoryNode> nodes = new HashMap<>();
    private final List<MemoryEdge> edges = new ArrayList<>();

    public void addNode(String id, String content, Map<String, String> meta) {
        nodes.put(id, new MemoryNode(id, content, null, meta != null ? meta : new HashMap<>()));
    }

    public void addEdge(String source, String target, String relation, double weight) {
        edges.add(new MemoryEdge(source, target, weight, relation));
    }

    public List<MemoryNode> search(String query, double threshold) {
        String q = query.toLowerCase();
        List<MemoryNode> results = new ArrayList<>();
        for (MemoryNode n : nodes.values()) {
            if (similarity(n.getContent().toLowerCase(), q) >= threshold) {
                results.add(n);
            }
        }
        return results;
    }

    public void consolidate() {
        Set<String> seen = new HashSet<>();
        List<MemoryEdge> merged = new ArrayList<>();
        for (MemoryEdge e : edges) {
            String key = e.getSource() + "->" + e.getTarget();
            if (seen.add(key)) {
                merged.add(e);
            }
        }
        edges.clear();
        edges.addAll(merged);
    }

    private double similarity(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) {
            return 0.0;
        }
        String[] wordsA = a.split("\\s+");
        String[] wordsB = b.split("\\s+");
        int common = 0;
        for (String wa : wordsA) {
            for (String wb : wordsB) {
                if (wa.equals(wb)) {
                    common++;
                }
            }
        }
        int denom = wordsA.length + wordsB.length;
        return denom == 0 ? 0.0 : (common * 2.0) / denom;
    }
}

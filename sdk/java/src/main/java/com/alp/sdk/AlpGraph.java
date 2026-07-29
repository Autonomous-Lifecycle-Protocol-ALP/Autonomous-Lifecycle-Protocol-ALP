package com.alp.sdk;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class AlpGraph {
    private final Map<String, GraphNode> nodes = new HashMap<>();
    private final Map<String, List<String>> adjacency = new HashMap<>();

    public void buildGraph(List<AlpObject> objects) {
        nodes.clear();
        adjacency.clear();
        for (AlpObject obj : objects) {
            nodes.put(obj.getId(), new GraphNode(obj.getId(), obj.getType()));
        }
        for (AlpObject obj : objects) {
            Object dependsOn = obj.getProperties().get("depends_on");
            if (dependsOn instanceof String depId) {
                adjacency.computeIfAbsent(depId, k -> new ArrayList<>()).add(obj.getId());
            }
        }
    }

    public List<GraphNode> topologicalSort() {
        Map<String, Integer> inDegree = new HashMap<>();
        for (String nodeId : nodes.keySet()) {
            inDegree.putIfAbsent(nodeId, 0);
        }
        for (List<String> deps : adjacency.values()) {
            for (String dep : deps) {
                inDegree.merge(dep, 1, Integer::sum);
            }
        }
        LinkedList<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
            }
        }
        List<GraphNode> result = new ArrayList<>();
        while (!queue.isEmpty()) {
            String nodeId = queue.removeFirst();
            GraphNode node = nodes.get(nodeId);
            if (node != null) {
                result.add(node);
            }
            List<String> neighbors = adjacency.getOrDefault(nodeId, new ArrayList<>());
            for (String neighbor : neighbors) {
                inDegree.merge(neighbor, -1, Integer::sum);
                if (inDegree.get(neighbor) == 0) {
                    queue.add(neighbor);
                }
            }
        }
        return result;
    }

    public void detectCycles() {
        List<GraphNode> sorted = topologicalSort();
        if (sorted.size() != nodes.size()) {
            throw new AlpError("Dependency cycle detected in ALP graph");
        }
    }

    public GraphNode getNode(String id) {
        return nodes.get(id);
    }
}

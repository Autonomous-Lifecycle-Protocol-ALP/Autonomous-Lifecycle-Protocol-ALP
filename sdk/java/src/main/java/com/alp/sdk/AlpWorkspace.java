package com.alp.sdk;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class AlpWorkspace {
    private final AlpParser parser = new AlpParser();
    private final AlpGraph graph = new AlpGraph();
    private final List<AlpObject> objects = new ArrayList<>();

    public void load(Path workspaceDir) throws IOException {
        Path alpDir = workspaceDir.resolve(".alp");
        if (!Files.isDirectory(alpDir)) {
            return;
        }
        loadDirectory(alpDir);
        graph.buildGraph(objects);
    }

    public void loadString(String source) {
        objects.addAll(parser.parse(source));
        graph.buildGraph(objects);
    }

    public List<AlpObject> getObjects() {
        return objects;
    }

    public AlpGraph getGraph() {
        return graph;
    }

    public List<GraphNode> getExecutionOrder() {
        return graph.topologicalSort();
    }

    public AlpObject findById(String id) {
        return objects.stream()
                .filter(o -> id.equals(o.getId()))
                .findFirst()
                .orElse(null);
    }

    private void loadDirectory(Path dir) throws IOException {
        Files.list(dir).forEach(path -> {
            try {
                if (Files.isDirectory(path)) {
                    loadDirectory(path);
                } else if (path.toString().endsWith(".alp")) {
                    String content = Files.readString(path);
                    objects.addAll(parser.parse(content));
                }
            } catch (IOException e) {
                throw new AlpError("Failed to load ALP file: " + path, e);
            }
        });
    }
}

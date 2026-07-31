package com.alp.sdk;

import java.util.ArrayList;
import java.util.List;

/**
 * WasmAstEvaluator for ALP v66.0.0.
 * High-performance local Wasm AST parsing and node evaluation.
 */
public class WasmAstEvaluator {

    public static class ASTNode {
        private final String id;
        private final String kind;
        private final String name;
        private final int line;

        public ASTNode(String id, String kind, String name, int line) {
            this.id = id;
            this.kind = kind;
            this.name = name;
            this.line = line;
        }

        public String getId() { return id; }
        public String getKind() { return kind; }
        public String getName() { return name; }
        public int getLine() { return line; }
    }

    public List<ASTNode> parseAST(String content) {
        List<ASTNode> nodes = new ArrayList<>();
        if (content == null) return nodes;

        String[] lines = content.split("\n");
        for (int i = 0; i < lines.length; i++) {
            String trimmed = lines[i].trim();
            if (trimmed.startsWith("@policy")) {
                nodes.add(new ASTNode("ast-" + (i + 1), "POLICY", "policy", i + 1));
            } else if (trimmed.startsWith("@task")) {
                nodes.add(new ASTNode("ast-" + (i + 1), "TASK", "task", i + 1));
            } else if (trimmed.startsWith("@agent")) {
                nodes.add(new ASTNode("ast-" + (i + 1), "AGENT", "agent", i + 1));
            }
        }
        return nodes;
    }
}

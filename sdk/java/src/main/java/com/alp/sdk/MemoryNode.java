package com.alp.sdk;

import java.util.Map;

public class MemoryNode {
    private String id;
    private String content;
    private double[] embed;
    private Map<String, String> meta;

    public MemoryNode(String id, String content, double[] embed, Map<String, String> meta) {
        this.id = id;
        this.content = content;
        this.embed = embed;
        this.meta = meta;
    }

    public String getId() { return id; }
    public String getContent() { return content; }
    public double[] getEmbed() { return embed; }
    public Map<String, String> getMeta() { return meta; }
}

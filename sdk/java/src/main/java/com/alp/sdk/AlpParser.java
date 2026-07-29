package com.alp.sdk;

import java.util.ArrayList;
import java.util.List;

public class AlpParser {

    public List<AlpObject> parse(String source) {
        List<AlpObject> objects = new ArrayList<>();
        String[] blocks = source.split("\\n\\s*\\n");
        for (String block : blocks) {
            String trimmed = block.trim();
            if (!trimmed.isEmpty()) {
                AlpObject obj = parseBlock(trimmed);
                if (obj != null) {
                    objects.add(obj);
                }
            }
        }
        return objects;
    }

    public AlpObject parseSingle(String source) {
        String trimmed = source.trim();
        if (trimmed.isEmpty()) {
            throw new AlpError("Empty source provided to parser");
        }
        AlpObject result = parseBlock(trimmed);
        if (result == null) {
            throw new AlpError("Failed to parse ALP block");
        }
        return result;
    }

    private AlpObject parseBlock(String block) {
        String[] lines = block.split("\\n");
        String id = null;
        String type = null;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("id:")) {
                id = trimmed.substring(3).trim();
            } else if (trimmed.startsWith("type:")) {
                type = trimmed.substring(5).trim();
            }
        }
        if (id == null || type == null) {
            return null;
        }
        return new AlpObject(id, type);
    }
}

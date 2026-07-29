package com.alp.sdk;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

public class AlpObject {
    private String id;
    private String type;
    private final Map<String, Object> properties = new LinkedHashMap<>();

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public AlpObject() {}

    public AlpObject(String id, String type) {
        this.id = id;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public AlpObject setId(String id) {
        this.id = id;
        return this;
    }

    public String getType() {
        return type;
    }

    public AlpObject setType(String type) {
        this.type = type;
        return this;
    }

    @JsonAnyGetter
    public Map<String, Object> getProperties() {
        return properties;
    }

    @JsonAnySetter
    public AlpObject setProperty(String key, Object value) {
        properties.put(key, value);
        return this;
    }

    public AlpObject setProperties(Map<String, Object> properties) {
        this.properties.clear();
        this.properties.putAll(properties);
        return this;
    }

    public String toAlpString() {
        try {
            return OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(this);
        } catch (Exception e) {
            throw new AlpError("Failed to serialize AlpObject", e);
        }
    }

    public static AlpObject fromJson(String json) {
        try {
            return OBJECT_MAPPER.readValue(json, AlpObject.class);
        } catch (Exception e) {
            throw new AlpError("Failed to parse AlpObject from JSON", e);
        }
    }
}

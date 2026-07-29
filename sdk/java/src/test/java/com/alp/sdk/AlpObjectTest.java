package com.alp.sdk;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AlpObjectTest {

    @Test
    void newObject_setsIdAndType() {
        AlpObject obj = new AlpObject("t1", "task");
        assertEquals("t1", obj.getId());
        assertEquals("task", obj.getType());
    }

    @Test
    void setProperty_addsProperty() {
        AlpObject obj = new AlpObject("t1", "task");
        obj.setProperty("priority", "high");
        assertEquals("high", obj.getProperties().get("priority"));
    }

    @Test
    void toAlpString_returnsJson() {
        AlpObject obj = new AlpObject("t1", "task");
        String json = obj.toAlpString();
        assertTrue(json.contains("\"id\":\"t1\""));
        assertTrue(json.contains("\"type\":\"task\""));
    }
}

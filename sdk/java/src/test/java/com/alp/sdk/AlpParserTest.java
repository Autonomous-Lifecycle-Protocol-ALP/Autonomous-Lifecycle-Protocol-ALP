package com.alp.sdk;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AlpParserTest {

    @Test
    void parseSingle_returnsObjectWithIdAndType() {
        AlpParser parser = new AlpParser();
        AlpObject obj = parser.parseSingle("id: task-1\ntype: task\n");

        assertEquals("task-1", obj.getId());
        assertEquals("task", obj.getType());
    }

    @Test
    void parse_returnsMultipleObjects() {
        AlpParser parser = new AlpParser();
        String source = "id: t1\ntype: task\n\nid: t2\ntype: feature\n";
        List<AlpObject> objects = parser.parse(source);

        assertEquals(2, objects.size());
        assertEquals("t1", objects.get(0).getId());
        assertEquals("t2", objects.get(1).getId());
    }

    @Test
    void parseSingle_emptySource_throws() {
        AlpParser parser = new AlpParser();
        assertThrows(AlpError.class, () -> parser.parseSingle(""));
    }

    @Test
    void parse_ignoresEmptyBlocks() {
        AlpParser parser = new AlpParser();
        List<AlpObject> objects = parser.parse("\n\nid: t1\ntype: task\n\n\n");
        assertEquals(1, objects.size());
    }
}

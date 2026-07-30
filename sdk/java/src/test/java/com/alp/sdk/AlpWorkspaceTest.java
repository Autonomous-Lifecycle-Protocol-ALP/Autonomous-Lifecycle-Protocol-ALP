package com.alp.sdk;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AlpWorkspaceTest {

    @Test
    void loadString_populatesObjectsAndGraph(@TempDir Path tempDir) throws IOException {
        Path alpFile = tempDir.resolve(".alp").resolve("test.alp");
        Files.createDirectories(alpFile.getParent());
        Files.writeString(alpFile, "id: t1\ntype: task\n");

        AlpWorkspace workspace = new AlpWorkspace();
        workspace.load(tempDir);

        List<AlpObject> objects = workspace.getObjects();
        assertEquals(1, objects.size());
        assertEquals("t1", objects.get(0).getId());
    }

    @Test
    void findById_returnsMatchingObject() {
        AlpWorkspace workspace = new AlpWorkspace();
        workspace.loadString("id: t1\ntype: task\n");

        AlpObject found = workspace.findById("t1");
        assertNotNull(found);
        assertEquals("t1", found.getId());
    }

    @Test
    void findById_returnsNullWhenMissing() {
        AlpWorkspace workspace = new AlpWorkspace();
        workspace.loadString("id: t1\ntype: task\n");

        assertNull(workspace.findById("missing"));
    }

    @Test
    void getExecutionOrder_returnsTopologicallySortedNodes() {
        AlpWorkspace workspace = new AlpWorkspace();
        workspace.loadString(
                "id: t1\ntype: task\n\nid: t2\ntype: task\ndepends_on: t1\n"
        );

        List<GraphNode> order = workspace.getExecutionOrder();
        assertFalse(order.isEmpty());
        assertEquals("t1", order.get(0).getId());
    }
}

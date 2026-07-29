package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AlpGraphTest {

    @Test
    void topologicalSort_returnsNodesInDependencyOrder() {
        AlpGraph graph = new AlpGraph();
        AlpObject t1 = new AlpObject("t1", "task");
        AlpObject t2 = new AlpObject("t2", "task");
        t2.setProperty("depends_on", "t1");
        graph.buildGraph(List.of(t1, t2));

        List<GraphNode> order = graph.topologicalSort();
        assertEquals(2, order.size());
        assertEquals("t1", order.get(0).getId());
        assertEquals("t2", order.get(1).getId());
    }

    @Test
    void detectCycles_throwsWhenCycleExists() {
        AlpGraph graph = new AlpGraph();
        AlpObject t1 = new AlpObject("t1", "task");
        AlpObject t2 = new AlpObject("t2", "task");
        t1.setProperty("depends_on", "t2");
        t2.setProperty("depends_on", "t1");
        graph.buildGraph(List.of(t1, t2));

        assertThrows(AlpError.class, graph::detectCycles);
    }
}

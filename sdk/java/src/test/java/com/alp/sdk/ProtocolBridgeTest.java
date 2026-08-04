package com.alp.sdk;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ProtocolBridgeTest {

    private Map<String, Object> workflow() {
        Map<String, Object> wf = new LinkedHashMap<>();
        wf.put("id", "wf-dev");
        wf.put("name", "Development Loop");
        List<Map<String, Object>> steps = new ArrayList<>();
        steps.add(mapOf("id", "s1", "name", "implement"));
        steps.add(mapOf("id", "s2", "name", "test"));
        steps.add(mapOf("id", "s3", "name", "verify", "depends_on", Arrays.asList("s1", "s2")));
        wf.put("steps", steps);
        return wf;
    }

    @Test
    void exportOpenAPI_returnsSpec() {
        ProtocolBridge bridge = new ProtocolBridge();
        BridgeExportResult result = bridge.exportWorkflow(workflow(), "openapi");
        assertEquals("openapi", result.getFormat());
        Map<String, Object> spec = (Map<String, Object>) result.getSpec();
        assertEquals("3.0.0", spec.get("openapi"));
        assertTrue(((Map<String, Object>) spec.get("paths")).containsKey("/implement"));
    }

    @Test
    void importOpenAPI_returnsWorkflow() {
        ProtocolBridge bridge = new ProtocolBridge();
        Map<String, Object> spec = new LinkedHashMap<>();
        spec.put("openapi", "3.0.0");
        spec.put("info", mapOf("title", "Test API", "version", "1.0.0"));
        spec.put("paths", mapOf("/hello", mapOf("post", mapOf("operationId", "sayHello"))));
        BridgeImportResult result = bridge.importSpec(spec, "openapi");
        assertEquals("openapi", result.getFormat());
        List<Map<String, Object>> steps = (List<Map<String, Object>>) result.getWorkflow().get("steps");
        assertEquals(1, steps.size());
        assertEquals("sayHello", steps.get(0).get("id"));
    }

    @Test
    void exportGraphQL_returnsSDL() {
        ProtocolBridge bridge = new ProtocolBridge();
        BridgeExportResult result = bridge.exportWorkflow(workflow(), "graphql");
        assertEquals("graphql", result.getFormat());
        String sdl = (String) result.getSpec();
        assertTrue(sdl.contains("type wf_devWorkflow"));
        assertTrue(sdl.contains("implement: String"));
    }

    @Test
    void exportGRPC_returnsProto() {
        ProtocolBridge bridge = new ProtocolBridge();
        BridgeExportResult result = bridge.exportWorkflow(workflow(), "grpc");
        assertEquals("grpc", result.getFormat());
        String proto = (String) result.getSpec();
        assertTrue(proto.contains("syntax = \"proto3\";"));
        assertTrue(proto.contains("service wf_devService"));
    }

    @Test
    void exportAsyncAPI_returnsSpec() {
        ProtocolBridge bridge = new ProtocolBridge();
        BridgeExportResult result = bridge.exportWorkflow(workflow(), "asyncapi");
        assertEquals("asyncapi", result.getFormat());
        Map<String, Object> spec = (Map<String, Object>) result.getSpec();
        assertEquals("2.0.0", spec.get("asyncapi"));
        assertTrue(((Map<String, Object>) spec.get("channels")).containsKey("wf-dev/implement"));
    }

    @Test
    void exportA2A_returnsAgentCard() {
        ProtocolBridge bridge = new ProtocolBridge();
        BridgeExportResult result = bridge.exportWorkflow(workflow(), "a2a");
        assertEquals("a2a", result.getFormat());
        Map<String, Object> card = (Map<String, Object>) result.getSpec();
        assertEquals("AgentCard", card.get("@type"));
        List<Map<String, Object>> skills = (List<Map<String, Object>>) card.get("skills");
        assertEquals(3, skills.size());
        assertEquals("implement", skills.get(0).get("name"));
    }

    @Test
    void importA2A_returnsWorkflow() {
        ProtocolBridge bridge = new ProtocolBridge();
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id", "agent-1");
        card.put("name", "Test Agent");
        card.put("skills", Arrays.asList(mapOf("id", "skill-1", "name", "Analyze")));
        BridgeImportResult result = bridge.importSpec(card, "a2a");
        assertEquals("a2a", result.getFormat());
        List<Map<String, Object>> steps = (List<Map<String, Object>>) result.getWorkflow().get("steps");
        assertEquals(1, steps.size());
        assertEquals("Analyze", steps.get(0).get("name"));
    }

    @Test
    void exportUnknownFormat_throws() {
        ProtocolBridge bridge = new ProtocolBridge();
        assertThrows(BridgeError.class, () -> bridge.exportWorkflow(workflow(), "xml"));
    }

    @Test
    void importUnknownFormat_throws() {
        ProtocolBridge bridge = new ProtocolBridge();
        assertThrows(BridgeError.class, () -> bridge.importSpec(new LinkedHashMap<>(), "xml"));
    }

    @SafeVarargs
    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put((String) kv[i], (Object) kv[i + 1]);
        }
        return map;
    }
}

package alpgo

import (
	"testing"
)

func workflow() map[string]interface{} {
	return map[string]interface{}{
		"id":   "wf-dev",
		"name": "Development Loop",
		"steps": []interface{}{
			map[string]interface{}{"id": "s1", "name": "implement"},
			map[string]interface{}{"id": "s2", "name": "test"},
			map[string]interface{}{"id": "s3", "name": "verify", "depends_on": []interface{}{"s1", "s2"}},
		},
	}
}

func TestProtocolBridgeSupportedFormats(t *testing.T) {
	bridge := NewProtocolBridge()
	// just ensure it doesn't panic on export/import of known formats
	for _, fmt := range []string{"openapi", "graphql", "grpc", "asyncapi", "a2a"} {
		_, err := bridge.ExportWorkflow(workflow(), fmt)
		if err != nil {
			t.Errorf("ExportWorkflow(%s) failed: %v", fmt, err)
		}
	}
}

func TestProtocolBridgeExportUnknownFormat(t *testing.T) {
	bridge := NewProtocolBridge()
	_, err := bridge.ExportWorkflow(workflow(), "xml")
	if err == nil {
		t.Error("expected error for unknown format")
	}
}

func TestProtocolBridgeImportUnknownFormat(t *testing.T) {
	bridge := NewProtocolBridge()
	_, err := bridge.ImportSpec(map[string]interface{}{}, "xml")
	if err == nil {
		t.Error("expected error for unknown format")
	}
}

func TestProtocolBridgeOpenAPIExport(t *testing.T) {
	bridge := NewProtocolBridge()
	result, err := bridge.ExportWorkflow(workflow(), "openapi")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Format != "openapi" {
		t.Errorf("expected format openapi, got %s", result.Format)
	}
	spec, _ := result.Spec.(map[string]interface{})
	if spec["openapi"] != "3.0.0" {
		t.Errorf("expected openapi 3.0.0")
	}
	paths, _ := spec["paths"].(map[string]interface{})
	if _, ok := paths["/implement"]; !ok {
		t.Error("expected /implement path")
	}
}

func TestProtocolBridgeOpenAPIImport(t *testing.T) {
	bridge := NewProtocolBridge()
	spec := map[string]interface{}{
		"openapi": "3.0.0",
		"info":    map[string]interface{}{"title": "Test API", "version": "1.0.0"},
		"paths": map[string]interface{}{
			"/hello": map[string]interface{}{
				"post": map[string]interface{}{"operationId": "sayHello"},
			},
		},
	}
	result, err := bridge.ImportSpec(spec, "openapi")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	wf, _ := result.Workflow["steps"].([]map[string]interface{})
	if len(wf) != 1 {
		t.Errorf("expected 1 step, got %d", len(wf))
	}
}

func TestProtocolBridgeA2AExport(t *testing.T) {
	bridge := NewProtocolBridge()
	result, err := bridge.ExportWorkflow(workflow(), "a2a")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	spec, _ := result.Spec.(map[string]interface{})
	if spec["@type"] != "AgentCard" {
		t.Errorf("expected AgentCard type")
	}
	skills, _ := spec["skills"].([]interface{})
	if len(skills) != 3 {
		t.Errorf("expected 3 skills, got %d", len(skills))
	}
}

func TestProtocolBridgeA2AImport(t *testing.T) {
	bridge := NewProtocolBridge()
	agentCard := map[string]interface{}{
		"id":     "agent-1",
		"name":   "Test Agent",
		"skills": []interface{}{map[string]interface{}{"id": "skill-1", "name": "Analyze"}},
	}
	result, err := bridge.ImportSpec(agentCard, "a2a")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	steps, _ := result.Workflow["steps"].([]map[string]interface{})
	if len(steps) != 1 {
		t.Errorf("expected 1 step, got %d", len(steps))
	}
}

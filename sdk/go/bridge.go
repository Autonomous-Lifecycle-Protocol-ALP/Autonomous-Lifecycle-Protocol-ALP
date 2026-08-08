package alpgo

import (
	"fmt"
	"strings"
)

const SUPPORTED_FORMATS = "openapi,graphql,grpc,asyncapi,a2a"

type BridgeError struct {
	message string
}

func NewBridgeError(message string) *BridgeError {
	return &BridgeError{message: message}
}

func (e *BridgeError) Error() string {
	return e.message
}

type BridgeExportResult struct {
	Format          string
	Spec            interface{}
	SourceWorkflowID string
	Warnings        []string
}

func NewBridgeExportResult(format, sourceWorkflowID string, spec interface{}) *BridgeExportResult {
	return &BridgeExportResult{
		Format:          format,
		Spec:            spec,
		SourceWorkflowID: sourceWorkflowID,
		Warnings:        []string{},
	}
}

type BridgeImportResult struct {
	Format     string
	Workflow   map[string]interface{}
	SourceSpec interface{}
	Warnings   []string
}

func NewBridgeImportResult(format string, workflow map[string]interface{}, sourceSpec interface{}) *BridgeImportResult {
	return &BridgeImportResult{
		Format:     format,
		Workflow:   workflow,
		SourceSpec: sourceSpec,
		Warnings:   []string{},
	}
}

type ProtocolBridge struct {
	exporters map[string]func(map[string]interface{}) (interface{}, []string)
	importers map[string]func(interface{}) (map[string]interface{}, []string)
}

func NewProtocolBridge() *ProtocolBridge {
	b := &ProtocolBridge{}
	b.exporters = map[string]func(map[string]interface{}) (interface{}, []string){
		"openapi":   b.exportOpenAPI,
		"graphql":   b.exportGraphQL,
		"grpc":      b.exportGRPC,
		"asyncapi":  b.exportAsyncAPI,
		"a2a":       b.exportA2A,
	}
	b.importers = map[string]func(interface{}) (map[string]interface{}, []string){
		"openapi":   b.importOpenAPI,
		"graphql":   b.importGraphQL,
		"grpc":      b.importGRPC,
		"asyncapi":  b.importAsyncAPI,
		"a2a":       b.importA2A,
	}
	return b
}

func (b *ProtocolBridge) ExportWorkflow(workflow map[string]interface{}, format string) (*BridgeExportResult, error) {
	format = strings.ToLower(format)
	exporter, ok := b.exporters[format]
	if !ok {
		return nil, NewBridgeError(fmt.Sprintf("Unsupported export format '%s'. Supported: %s", format, SUPPORTED_FORMATS))
	}
	spec, _ := exporter(workflow)
	sourceWorkflowID := ""
	if v, ok := workflow["id"].(string); ok {
		sourceWorkflowID = v
	} else if v, ok := workflow["name"].(string); ok {
		sourceWorkflowID = v
	} else {
		sourceWorkflowID = "_unknown"
	}
	return NewBridgeExportResult(format, sourceWorkflowID, spec), nil
}

func (b *ProtocolBridge) ImportSpec(spec interface{}, format string) (*BridgeImportResult, error) {
	format = strings.ToLower(format)
	importer, ok := b.importers[format]
	if !ok {
		return nil, NewBridgeError(fmt.Sprintf("Unsupported import format '%s'. Supported: %s", format, SUPPORTED_FORMATS))
	}
	workflow, _ := importer(spec)
	return NewBridgeImportResult(format, workflow, spec), nil
}

func (b *ProtocolBridge) exportOpenAPI(workflow map[string]interface{}) (interface{}, []string) {
	warnings := []string{}
	wfID := getString(workflow, "id", getString(workflow, "name", "_unknown"))
	paths := map[string]interface{}{}
	schemas := map[string]interface{}{}
	stepIdx := 0

	steps := getSlice(workflow, "steps")
	for _, stepRaw := range steps {
		step, _ := stepRaw.(map[string]interface{})
		stepName := getString(step, "name", getString(step, "id", fmt.Sprintf("step-%d", stepIdx)))
		path := "/" + stepName
		stepIdx++
		requestBody := map[string]interface{}{
			"content": map[string]interface{}{
				"application/json": map[string]interface{}{
					"schema": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"input": map[string]interface{}{"type": "string"},
						},
					},
				},
			},
		}
		responses := map[string]interface{}{
			"200": map[string]interface{}{
				"description": "Success",
				"content": map[string]interface{}{
					"application/json": map[string]interface{}{
						"schema": map[string]interface{}{"type": "object"},
					},
				},
			},
		}
		paths[path] = map[string]interface{}{
			"post": map[string]interface{}{
				"operationId":  fmt.Sprintf("%s.%s", wfID, stepName),
				"requestBody": requestBody,
				"responses":   responses,
			},
		}
		schemaName := fmt.Sprintf("%s.%s.Request", wfID, stepName)
		schemas[schemaName] = map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"input": map[string]interface{}{"type": "string"},
			},
			"required": []string{"input"},
		}
	}

	if len(paths) == 0 {
		warnings = append(warnings, "Workflow has no steps; OpenAPI spec will be empty.")
	}

	spec := map[string]interface{}{
		"openapi": "3.0.0",
		"info": map[string]interface{}{
			"title":   fmt.Sprintf("ALP Workflow: %s", wfID),
			"version": "1.0.0",
		},
		"paths":      paths,
		"components": map[string]interface{}{"schemas": schemas},
	}
	return spec, warnings
}

func (b *ProtocolBridge) importOpenAPI(spec interface{}) (map[string]interface{}, []string) {
	warnings := []string{}
	specMap, _ := spec.(map[string]interface{})
	info := getMap(specMap, "info")
	title := getString(info, "title", "imported-workflow")
	wfID := strings.ReplaceAll(strings.ToLower(title), " ", "-")
	steps := []map[string]interface{}{}

	paths := getMap(specMap, "paths")
	for path, methodsRaw := range paths {
		methods, _ := methodsRaw.(map[string]interface{})
		for _, detailsRaw := range methods {
			details, ok := detailsRaw.(map[string]interface{})
			if !ok {
				continue
			}
			opID := getString(details, "operationId", strings.TrimLeft(path, "/"))
			steps = append(steps, map[string]interface{}{
				"id":   opID,
				"name": opID,
				"type": "step",
			})
			break
		}
	}

	workflow := map[string]interface{}{
		"id":           wfID,
		"name":         title,
		"source_format": "openapi",
		"steps":        steps,
	}
	if len(steps) == 0 {
		warnings = append(warnings, "No paths found in OpenAPI spec.")
	}
	return workflow, warnings
}

func (b *ProtocolBridge) exportGraphQL(workflow map[string]interface{}) (interface{}, []string) {
	warnings := []string{}
	wfID := strings.ReplaceAll(getString(workflow, "id", getString(workflow, "name", "_unknown")), "-", "_")
	typeName := wfID + "Workflow"
	lines := []string{fmt.Sprintf("type %s {", typeName)}
	steps := getSlice(workflow, "steps")
	for _, stepRaw := range steps {
		step, _ := stepRaw.(map[string]interface{})
		name := strings.ReplaceAll(getString(step, "name", getString(step, "id", "step")), "-", "_")
		lines = append(lines, fmt.Sprintf("  %s: String", name))
	}
	lines = append(lines, "}")
	lines = append(lines, "")
	lines = append(lines, "type Query {")
	lines = append(lines, fmt.Sprintf("  %s: %s", wfID, typeName))
	lines = append(lines, "}")
	return strings.Join(lines, "\n"), warnings
}

func (b *ProtocolBridge) importGraphQL(spec interface{}) (map[string]interface{}, []string) {
	warnings := []string{}
	var sdl string
	switch v := spec.(type) {
	case string:
		sdl = v
	case map[string]interface{}:
		sdl = fmt.Sprintf("%v", v)
	default:
		sdl = fmt.Sprintf("%v", spec)
	}
	steps := []map[string]interface{}{}
	for _, line := range strings.Split(sdl, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "type ") || line == "}" {
			continue
		}
		if strings.Contains(line, ": ") && !strings.HasPrefix(line, "#") {
			fieldName := strings.Split(line, ":")[0]
			fieldName = strings.Trim(fieldName, " {")
			if fieldName != "" {
				steps = append(steps, map[string]interface{}{
					"id":   fieldName,
					"name": fieldName,
					"type": "step",
				})
			}
		}
	}
	workflow := map[string]interface{}{
		"id":           "imported-graphql-workflow",
		"name":         "Imported GraphQL Workflow",
		"source_format": "graphql",
		"steps":        steps,
	}
	if len(steps) == 0 {
		warnings = append(warnings, "No fields found in GraphQL SDL.")
	}
	return workflow, warnings
}

func (b *ProtocolBridge) exportGRPC(workflow map[string]interface{}) (interface{}, []string) {
	warnings := []string{}
	wfID := strings.ReplaceAll(getString(workflow, "id", getString(workflow, "name", "_unknown")), "-", "_")
	serviceName := wfID + "Service"
	lines := []string{`syntax = "proto3";`, "", "package alp;", "", fmt.Sprintf("service %s {", serviceName)}
	steps := getSlice(workflow, "steps")
	for _, stepRaw := range steps {
		step, _ := stepRaw.(map[string]interface{})
		name := strings.ReplaceAll(getString(step, "name", getString(step, "id", "step")), "-", "_")
		lines = append(lines, fmt.Sprintf("  rpc %s(%sRequest) returns (%sResponse);", name, name, name))
	}
	lines = append(lines, "}")
	lines = append(lines, "")
	for _, stepRaw := range steps {
		step, _ := stepRaw.(map[string]interface{})
		name := strings.ReplaceAll(getString(step, "name", getString(step, "id", "step")), "-", "_")
		lines = append(lines, fmt.Sprintf("message %sRequest {", name))
		lines = append(lines, "  string input = 1;")
		lines = append(lines, fmt.Sprintf("}"))
		lines = append(lines, fmt.Sprintf("message %sResponse {", name))
		lines = append(lines, "  string output = 1;")
		lines = append(lines, fmt.Sprintf("}"))
		lines = append(lines, "")
	}
	return strings.Join(lines, "\n"), warnings
}

func (b *ProtocolBridge) importGRPC(spec interface{}) (map[string]interface{}, []string) {
	warnings := []string{}
	var proto string
	switch v := spec.(type) {
	case string:
		proto = v
	case map[string]interface{}:
		proto = fmt.Sprintf("%v", v)
	default:
		proto = fmt.Sprintf("%v", spec)
	}
	steps := []map[string]interface{}{}
	for _, line := range strings.Split(proto, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "rpc ") && strings.Contains(line, "(") {
			rpcName := strings.Split(line, "(")[0]
			rpcName = strings.TrimPrefix(rpcName, "rpc ")
			rpcName = strings.TrimSpace(rpcName)
			if rpcName != "" {
				steps = append(steps, map[string]interface{}{
					"id":   rpcName,
					"name": rpcName,
					"type": "step",
				})
			}
		}
	}
	workflow := map[string]interface{}{
		"id":           "imported-grpc-workflow",
		"name":         "Imported gRPC Workflow",
		"source_format": "grpc",
		"steps":        steps,
	}
	if len(steps) == 0 {
		warnings = append(warnings, "No RPC methods found in proto spec.")
	}
	return workflow, warnings
}

func (b *ProtocolBridge) exportAsyncAPI(workflow map[string]interface{}) (interface{}, []string) {
	warnings := []string{}
	wfID := getString(workflow, "id", getString(workflow, "name", "_unknown"))
	channels := map[string]interface{}{}
	steps := getSlice(workflow, "steps")
	for _, stepRaw := range steps {
		step, _ := stepRaw.(map[string]interface{})
		name := getString(step, "name", getString(step, "id", "step"))
		channelName := fmt.Sprintf("%s/%s", wfID, name)
		channels[channelName] = map[string]interface{}{
			"publish": map[string]interface{}{
				"message": map[string]interface{}{
					"name": fmt.Sprintf("%sRequest", name),
					"payload": map[string]interface{}{"type": "object", "properties": map[string]interface{}{"input": map[string]interface{}{"type": "string"}}},
				},
			},
			"subscribe": map[string]interface{}{
				"message": map[string]interface{}{
					"name": fmt.Sprintf("%sResponse", name),
					"payload": map[string]interface{}{"type": "object", "properties": map[string]interface{}{"output": map[string]interface{}{"type": "string"}}},
				},
			},
		}
	}
	spec := map[string]interface{}{
		"asyncapi": "2.0.0",
		"info": map[string]interface{}{
			"title":   fmt.Sprintf("ALP Workflow: %s", wfID),
			"version": "1.0.0",
		},
		"channels": channels,
	}
	if len(channels) == 0 {
		warnings = append(warnings, "Workflow has no steps; AsyncAPI spec will be empty.")
	}
	return spec, warnings
}

func (b *ProtocolBridge) importAsyncAPI(spec interface{}) (map[string]interface{}, []string) {
	warnings := []string{}
	specMap, _ := spec.(map[string]interface{})
	info := getMap(specMap, "info")
	title := getString(info, "title", "imported-asyncapi-workflow")
	wfID := strings.ReplaceAll(strings.ToLower(title), " ", "-")
	steps := []map[string]interface{}{}

	channels := getMap(specMap, "channels")
	for _, channelRaw := range channels {
		channel, _ := channelRaw.(map[string]interface{})
		pub := getMap(channel, "publish")
		msg := getMap(pub, "message")
		name := getString(msg, "name", "step")
		steps = append(steps, map[string]interface{}{
			"id":   name,
			"name": name,
			"type": "step",
		})
	}

	workflow := map[string]interface{}{
		"id":           wfID,
		"name":         title,
		"source_format": "asyncapi",
		"steps":        steps,
	}
	if len(steps) == 0 {
		warnings = append(warnings, "No channels found in AsyncAPI spec.")
	}
	return workflow, warnings
}

func (b *ProtocolBridge) exportA2A(workflow map[string]interface{}) (interface{}, []string) {
	warnings := []string{}
	wfID := getString(workflow, "id", getString(workflow, "name", "alp-workflow"))
	agentCard := map[string]interface{}{
		"@context":     "https://a2a-protocol.org/v1",
		"@type":        "AgentCard",
		"id":           wfID,
		"name":         getString(workflow, "name", wfID),
		"description":  getString(workflow, "description", "ALP-generated A2A agent"),
		"capabilities": map[string]interface{}{"streaming": false, "pushNotifications": false},
		"skills":       []interface{}{},
	}
	steps := getSlice(workflow, "steps")
	for idx, stepRaw := range steps {
		step, _ := stepRaw.(map[string]interface{})
		skillID := getString(step, "id", getString(step, "name", fmt.Sprintf("skill-%x", idx)))
		skillName := getString(step, "name", getString(step, "id", "Unknown Skill"))
		agentCard["skills"] = append(agentCard["skills"].([]interface{}), map[string]interface{}{
			"id":          skillID,
			"name":        skillName,
			"description": getString(step, "description", fmt.Sprintf("Step from %s", wfID)),
		})
	}
	return agentCard, warnings
}

func (b *ProtocolBridge) importA2A(spec interface{}) (map[string]interface{}, []string) {
	warnings := []string{}
	specMap, _ := spec.(map[string]interface{})
	agentID := getString(specMap, "id", getString(specMap, "name", "imported-a2a-agent"))
	skills := getSlice(specMap, "skills")
	steps := []map[string]interface{}{}
	for idx, skillRaw := range skills {
		skill, _ := skillRaw.(map[string]interface{})
		stepID := getString(skill, "id", fmt.Sprintf("step-%x", idx))
		stepName := getString(skill, "name", getString(skill, "id", "Imported Step"))
		steps = append(steps, map[string]interface{}{
			"id":          stepID,
			"name":        stepName,
			"type":        "step",
			"description": getString(skill, "description", ""),
		})
	}
	workflow := map[string]interface{}{
		"id":           agentID,
		"name":         getString(specMap, "name", agentID),
		"source_format": "a2a",
		"steps":        steps,
	}
	if len(steps) == 0 {
		warnings = append(warnings, "No skills found in A2A agent card.")
	}
	return workflow, warnings
}

func getString(m map[string]interface{}, key, defaultVal string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return defaultVal
}

func getMap(m map[string]interface{}, key string) map[string]interface{} {
	if v, ok := m[key].(map[string]interface{}); ok {
		return v
	}
	return map[string]interface{}{}
}

func getSlice(m map[string]interface{}, key string) []interface{} {
	if v, ok := m[key].([]interface{}); ok {
		return v
	}
	return []interface{}{}
}

package com.alp.sdk;

import java.util.*;

public class ProtocolBridge {
    private final Map<String, Exporter> exporters = new LinkedHashMap<>();
    private final Map<String, Importer> importers = new LinkedHashMap<>();

    public ProtocolBridge() {
        exporters.put("openapi", this::exportOpenAPI);
        exporters.put("graphql", this::exportGraphQL);
        exporters.put("grpc", this::exportGRPC);
        exporters.put("asyncapi", this::exportAsyncAPI);
        exporters.put("a2a", this::exportA2A);

        importers.put("openapi", this::importOpenAPI);
        importers.put("graphql", this::importGraphQL);
        importers.put("grpc", this::importGRPC);
        importers.put("asyncapi", this::importAsyncAPI);
        importers.put("a2a", this::importA2A);
    }

    public BridgeExportResult exportWorkflow(Map<String, Object> workflow, String fmt) {
        String format = fmt.toLowerCase();
        Exporter exporter = exporters.get(format);
        if (exporter == null) {
            throw new BridgeError("Unsupported export format '" + format + "'. Supported: openapi,graphql,grpc,asyncapi,a2a");
        }
        Object spec = exporter.export(workflow);
        List<String> warnings = new ArrayList<>();
        String sourceWorkflowId = getString(workflow, "id", getString(workflow, "name", "_unknown"));
        return new BridgeExportResult(format, sourceWorkflowId, spec, warnings);
    }

    public BridgeImportResult importSpec(Object spec, String fmt) {
        String format = fmt.toLowerCase();
        Importer importer = importers.get(format);
        if (importer == null) {
            throw new BridgeError("Unsupported import format '" + format + "'. Supported: openapi,graphql,grpc,asyncapi,a2a");
        }
        Map<String, Object> workflow = importer.import_(spec);
        List<String> warnings = new ArrayList<>();
        return new BridgeImportResult(format, workflow, spec, warnings);
    }

    private Map<String, Object> exportOpenAPI(Map<String, Object> workflow) {
        List<String> warnings = new ArrayList<>();
        String wfId = getString(workflow, "id", getString(workflow, "name", "_unknown"));
        Map<String, Object> paths = new LinkedHashMap<>();
        Map<String, Object> schemas = new LinkedHashMap<>();
        int stepIdx = 0;

        List<Map<String, Object>> steps = getList(workflow, "steps");
        for (Map<String, Object> step : steps) {
            String stepName = getString(step, "name", getString(step, "id", "step-" + stepIdx));
            String path = "/" + stepName;
            stepIdx++;

            Map<String, Object> requestBody = new LinkedHashMap<>();
            Map<String, Object> content = new LinkedHashMap<>();
            Map<String, Object> jsonContent = new LinkedHashMap<>();
            Map<String, Object> schema = new LinkedHashMap<>();
            schema.put("type", "object");
            Map<String, Object> inputProp = new LinkedHashMap<>();
            inputProp.put("type", "string");
            Map<String, Object> properties = new LinkedHashMap<>();
            properties.put("input", inputProp);
            schema.put("properties", properties);
            jsonContent.put("schema", schema);
            content.put("application/json", jsonContent);
            requestBody.put("content", content);

            Map<String, Object> responses = new LinkedHashMap<>();
            Map<String, Object> okResponse = new LinkedHashMap<>();
            okResponse.put("description", "Success");
            Map<String, Object> okContent = new LinkedHashMap<>();
            Map<String, Object> okSchema = new LinkedHashMap<>();
            okSchema.put("type", "object");
            okContent.put("schema", okSchema);
            okContent.put("application/json", okContent);
            responses.put("200", okResponse);

            Map<String, Object> post = new LinkedHashMap<>();
            post.put("operationId", wfId + "." + stepName);
            post.put("requestBody", requestBody);
            post.put("responses", responses);
            paths.put(path, post);

            String schemaName = wfId + "." + stepName + ".Request";
            Map<String, Object> reqSchema = new LinkedHashMap<>();
            reqSchema.put("type", "object");
            Map<String, Object> reqProps = new LinkedHashMap<>();
            Map<String, Object> reqInput = new LinkedHashMap<>();
            reqInput.put("type", "string");
            reqProps.put("input", reqInput);
            reqSchema.put("properties", reqProps);
            reqSchema.put("required", Collections.singletonList("input"));
            schemas.put(schemaName, reqSchema);
        }

        if (paths.isEmpty()) {
            warnings.add("Workflow has no steps; OpenAPI spec will be empty.");
        }

        Map<String, Object> spec = new LinkedHashMap<>();
        spec.put("openapi", "3.0.0");
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("title", "ALP Workflow: " + wfId);
        info.put("version", "1.0.0");
        spec.put("info", info);
        spec.put("paths", paths);
        Map<String, Object> components = new LinkedHashMap<>();
        components.put("schemas", schemas);
        spec.put("components", components);
        return spec;
    }

    private Map<String, Object> importOpenAPI(Object spec) {
        List<String> warnings = new ArrayList<>();
        Map<String, Object> specMap = toMap(spec);
        Map<String, Object> info = getMap(specMap, "info");
        String title = getString(info, "title", "imported-workflow");
        String wfId = title.replace(" ", "-").toLowerCase();
        List<Map<String, Object>> steps = new ArrayList<>();

        Map<String, Object> paths = getMap(specMap, "paths");
        for (Map.Entry<String, Object> entry : paths.entrySet()) {
            String path = entry.getKey();
            Object methodsObj = entry.getValue();
            if (methodsObj instanceof Map) {
                Map<String, Object> methods = (Map<String, Object>) methodsObj;
                for (Map.Entry<String, Object> methodEntry : methods.entrySet()) {
                    Object detailsObj = methodEntry.getValue();
                    if (detailsObj instanceof Map) {
                        Map<String, Object> details = (Map<String, Object>) detailsObj;
                        String opId = getString(details, "operationId", path.replaceFirst("^/", ""));
                        Map<String, Object> step = new LinkedHashMap<>();
                        step.put("id", opId);
                        step.put("name", opId);
                        step.put("type", "step");
                        steps.add(step);
                        break;
                    }
                }
            }
        }

        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", wfId);
        workflow.put("name", title);
        workflow.put("source_format", "openapi");
        workflow.put("steps", steps);
        if (steps.isEmpty()) {
            warnings.add("No paths found in OpenAPI spec.");
        }
        return workflow;
    }

    private String exportGraphQL(Map<String, Object> workflow) {
        String wfId = getString(workflow, "id", getString(workflow, "name", "_unknown")).replace("-", "_");
        String typeName = wfId + "Workflow";
        StringBuilder sb = new StringBuilder();
        sb.append("type ").append(typeName).append(" {\n");
        List<Map<String, Object>> steps = getList(workflow, "steps");
        for (Map<String, Object> step : steps) {
            String name = getString(step, "name", getString(step, "id", "step")).replace("-", "_");
            sb.append("  ").append(name).append(": String\n");
        }
        sb.append("}\n\n");
        sb.append("type Query {\n");
        sb.append("  ").append(wfId).append(": ").append(typeName).append("\n");
        sb.append("}\n");
        return sb.toString();
    }

    private Map<String, Object> importGraphQL(Object spec) {
        List<String> warnings = new ArrayList<>();
        String sdl = spec instanceof String ? (String) spec : spec.toString();
        List<Map<String, Object>> steps = new ArrayList<>();
        for (String line : sdl.split("\n")) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("type ") || line.equals("}")) {
                continue;
            }
            if (line.contains(": ") && !line.startsWith("#")) {
                String fieldName = line.split(":")[0].trim().replace("{", "").trim();
                if (!fieldName.isEmpty()) {
                    Map<String, Object> step = new LinkedHashMap<>();
                    step.put("id", fieldName);
                    step.put("name", fieldName);
                    step.put("type", "step");
                    steps.add(step);
                }
            }
        }
        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", "imported-graphql-workflow");
        workflow.put("name", "Imported GraphQL Workflow");
        workflow.put("source_format", "graphql");
        workflow.put("steps", steps);
        if (steps.isEmpty()) {
            warnings.add("No fields found in GraphQL SDL.");
        }
        return workflow;
    }

    private String exportGRPC(Map<String, Object> workflow) {
        String wfId = getString(workflow, "id", getString(workflow, "name", "_unknown")).replace("-", "_");
        String serviceName = wfId + "Service";
        StringBuilder sb = new StringBuilder();
        sb.append("syntax = \"proto3\";\n\n");
        sb.append("package alp;\n\n");
        sb.append("service ").append(serviceName).append(" {\n");
        List<Map<String, Object>> steps = getList(workflow, "steps");
        for (Map<String, Object> step : steps) {
            String name = getString(step, "name", getString(step, "id", "step")).replace("-", "_");
            sb.append("  rpc ").append(name).append("(").append(name).append("Request) returns (").append(name).append("Response);\n");
        }
        sb.append("}\n\n");
        for (Map<String, Object> step : steps) {
            String name = getString(step, "name", getString(step, "id", "step")).replace("-", "_");
            sb.append("message ").append(name).append("Request {\n");
            sb.append("  string input = 1;\n");
            sb.append("}\n");
            sb.append("message ").append(name).append("Response {\n");
            sb.append("  string output = 1;\n");
            sb.append("}\n\n");
        }
        return sb.toString();
    }

    private Map<String, Object> importGRPC(Object spec) {
        List<String> warnings = new ArrayList<>();
        String proto = spec instanceof String ? (String) spec : spec.toString();
        List<Map<String, Object>> steps = new ArrayList<>();
        for (String line : proto.split("\n")) {
            line = line.trim();
            if (line.startsWith("rpc ") && line.contains("(")) {
                String rpcName = line.split("\\(")[0].replace("rpc ", "").trim();
                if (!rpcName.isEmpty()) {
                    Map<String, Object> step = new LinkedHashMap<>();
                    step.put("id", rpcName);
                    step.put("name", rpcName);
                    step.put("type", "step");
                    steps.add(step);
                }
            }
        }
        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", "imported-grpc-workflow");
        workflow.put("name", "Imported gRPC Workflow");
        workflow.put("source_format", "grpc");
        workflow.put("steps", steps);
        if (steps.isEmpty()) {
            warnings.add("No RPC methods found in proto spec.");
        }
        return workflow;
    }

    private Map<String, Object> exportAsyncAPI(Map<String, Object> workflow) {
        List<String> warnings = new ArrayList<>();
        String wfId = getString(workflow, "id", getString(workflow, "name", "_unknown"));
        Map<String, Object> channels = new LinkedHashMap<>();
        List<Map<String, Object>> steps = getList(workflow, "steps");
        for (Map<String, Object> step : steps) {
            String name = getString(step, "name", getString(step, "id", "step"));
            String channelName = wfId + "/" + name;
            Map<String, Object> publish = new LinkedHashMap<>();
            Map<String, Object> pubMessage = new LinkedHashMap<>();
            pubMessage.put("name", name + "Request");
            Map<String, Object> pubPayload = new LinkedHashMap<>();
            pubPayload.put("type", "object");
            Map<String, Object> pubProps = new LinkedHashMap<>();
            Map<String, Object> pubInput = new LinkedHashMap<>();
            pubInput.put("type", "string");
            pubProps.put("input", pubInput);
            pubPayload.put("properties", pubProps);
            pubMessage.put("payload", pubPayload);
            publish.put("message", pubMessage);

            Map<String, Object> subscribe = new LinkedHashMap<>();
            Map<String, Object> subMessage = new LinkedHashMap<>();
            subMessage.put("name", name + "Response");
            Map<String, Object> subPayload = new LinkedHashMap<>();
            subPayload.put("type", "object");
            Map<String, Object> subProps = new LinkedHashMap<>();
            Map<String, Object> subOutput = new LinkedHashMap<>();
            subOutput.put("type", "string");
            subProps.put("output", subOutput);
            subPayload.put("properties", subProps);
            subMessage.put("payload", subPayload);
            subscribe.put("message", subMessage);

            Map<String, Object> channel = new LinkedHashMap<>();
            channel.put("publish", publish);
            channel.put("subscribe", subscribe);
            channels.put(channelName, channel);
        }

        Map<String, Object> spec = new LinkedHashMap<>();
        spec.put("asyncapi", "2.0.0");
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("title", "ALP Workflow: " + wfId);
        info.put("version", "1.0.0");
        spec.put("info", info);
        spec.put("channels", channels);
        if (channels.isEmpty()) {
            warnings.add("Workflow has no steps; AsyncAPI spec will be empty.");
        }
        return spec;
    }

    private Map<String, Object> importAsyncAPI(Object spec) {
        List<String> warnings = new ArrayList<>();
        Map<String, Object> specMap = toMap(spec);
        Map<String, Object> info = getMap(specMap, "info");
        String title = getString(info, "title", "imported-asyncapi-workflow");
        String wfId = title.replace(" ", "-").toLowerCase();
        List<Map<String, Object>> steps = new ArrayList<>();

        Map<String, Object> channels = getMap(specMap, "channels");
        for (Object channelRaw : channels.values()) {
            Map<String, Object> channel = toMap(channelRaw);
            Map<String, Object> publish = getMap(channel, "publish");
            Map<String, Object> message = getMap(publish, "message");
            String name = getString(message, "name", "step");
            Map<String, Object> step = new LinkedHashMap<>();
            step.put("id", name);
            step.put("name", name);
            step.put("type", "step");
            steps.add(step);
        }

        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", wfId);
        workflow.put("name", title);
        workflow.put("source_format", "asyncapi");
        workflow.put("steps", steps);
        if (steps.isEmpty()) {
            warnings.add("No channels found in AsyncAPI spec.");
        }
        return workflow;
    }

    private Map<String, Object> exportA2A(Map<String, Object> workflow) {
        List<String> warnings = new ArrayList<>();
        String wfId = getString(workflow, "id", getString(workflow, "name", "alp-workflow"));
        Map<String, Object> agentCard = new LinkedHashMap<>();
        agentCard.put("@context", "https://a2a-protocol.org/v1");
        agentCard.put("@type", "AgentCard");
        agentCard.put("id", wfId);
        agentCard.put("name", getString(workflow, "name", wfId));
        agentCard.put("description", getString(workflow, "description", "ALP-generated A2A agent"));
        Map<String, Object> capabilities = new LinkedHashMap<>();
        capabilities.put("streaming", false);
        capabilities.put("pushNotifications", false);
        agentCard.put("capabilities", capabilities);
        List<Map<String, Object>> skills = new ArrayList<>();
        agentCard.put("skills", skills);

        List<Map<String, Object>> steps = getList(workflow, "steps");
        for (int idx = 0; idx < steps.size(); idx++) {
            Map<String, Object> step = steps.get(idx);
            String skillId = getString(step, "id", getString(step, "name", "skill-" + Integer.toHexString(idx)));
            String skillName = getString(step, "name", getString(step, "id", "Unknown Skill"));
            Map<String, Object> skill = new LinkedHashMap<>();
            skill.put("id", skillId);
            skill.put("name", skillName);
            skill.put("description", getString(step, "description", "Step from " + wfId));
            skills.add(skill);
        }
        return agentCard;
    }

    private Map<String, Object> importA2A(Object spec) {
        List<String> warnings = new ArrayList<>();
        Map<String, Object> specMap = toMap(spec);
        String agentId = getString(specMap, "id", getString(specMap, "name", "imported-a2a-agent"));
        List<Map<String, Object>> skills = getList(specMap, "skills");
        List<Map<String, Object>> steps = new ArrayList<>();
        for (int idx = 0; idx < skills.size(); idx++) {
            Map<String, Object> skill = skills.get(idx);
            String stepId = getString(skill, "id", "step-" + Integer.toHexString(idx));
            String stepName = getString(skill, "name", getString(skill, "id", "Imported Step"));
            Map<String, Object> step = new LinkedHashMap<>();
            step.put("id", stepId);
            step.put("name", stepName);
            step.put("type", "step");
            step.put("description", getString(skill, "description", ""));
            steps.add(step);
        }
        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("id", agentId);
        workflow.put("name", getString(specMap, "name", agentId));
        workflow.put("source_format", "a2a");
        workflow.put("steps", steps);
        if (steps.isEmpty()) {
            warnings.add("No skills found in A2A agent card.");
        }
        return workflow;
    }

    @SuppressWarnings("unchecked")
    private static String getString(Map<String, Object> map, String key, String defaultVal) {
        Object v = map.get(key);
        if (v instanceof String) {
            return (String) v;
        }
        return defaultVal;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> getMap(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof Map) {
            return (Map<String, Object>) v;
        }
        return new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> getList(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof List) {
            List<?> list = (List<?>) v;
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map) {
                    result.add((Map<String, Object>) item);
                }
            }
            return result;
        }
        return new ArrayList<>();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> toMap(Object obj) {
        if (obj instanceof Map) {
            return (Map<String, Object>) obj;
        }
        return new LinkedHashMap<>();
    }

    private interface Exporter {
        Object export(Map<String, Object> workflow);
    }

    private interface Importer {
        Map<String, Object> import_(Object spec);
    }
}

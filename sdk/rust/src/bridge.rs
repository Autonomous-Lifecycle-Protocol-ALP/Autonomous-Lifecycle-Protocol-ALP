use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const SUPPORTED_FORMATS: &[&str] = &["openapi", "graphql", "grpc", "asyncapi", "a2a"];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeExportResult {
    pub format: String,
    pub spec: serde_json::Value,
    pub source_workflow_id: String,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeImportResult {
    pub format: String,
    pub workflow: HashMap<String, serde_json::Value>,
    pub source_spec: serde_json::Value,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeError {
    pub message: String,
}

impl std::fmt::Display for BridgeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for BridgeError {}

pub struct ProtocolBridge;

impl ProtocolBridge {
    pub fn new() -> Self {
        Self
    }

    pub fn export_workflow(
        &self,
        workflow: &HashMap<String, serde_json::Value>,
        fmt: &str,
    ) -> Result<BridgeExportResult, BridgeError> {
        let fmt = fmt.to_lowercase();
        if !SUPPORTED_FORMATS.contains(&fmt.as_str()) {
            return Err(BridgeError {
                message: format!(
                    "Unsupported export format '{}'. Supported: {:?}",
                    fmt, SUPPORTED_FORMATS
                ),
            });
        }
        let (spec, warnings) = match fmt.as_str() {
            "openapi" => self.export_openapi(workflow),
            "graphql" => self.export_graphql(workflow),
            "grpc" => self.export_grpc(workflow),
            "asyncapi" => self.export_asyncapi(workflow),
            "a2a" => self.export_a2a(workflow),
            _ => (serde_json::Value::Null, vec![]),
        };
        let source_workflow_id = workflow
            .get("id")
            .or_else(|| workflow.get("name"))
            .and_then(|v| v.as_str())
            .unwrap_or("_unknown")
            .to_string();
        Ok(BridgeExportResult {
            format: fmt,
            spec,
            source_workflow_id,
            warnings,
        })
    }

    pub fn import_spec(
        &self,
        spec: &serde_json::Value,
        fmt: &str,
    ) -> Result<BridgeImportResult, BridgeError> {
        let fmt = fmt.to_lowercase();
        if !SUPPORTED_FORMATS.contains(&fmt.as_str()) {
            return Err(BridgeError {
                message: format!(
                    "Unsupported import format '{}'. Supported: {:?}",
                    fmt, SUPPORTED_FORMATS
                ),
            });
        }
        let (workflow, warnings) = match fmt.as_str() {
            "openapi" => self.import_openapi(spec),
            "graphql" => self.import_graphql(spec),
            "grpc" => self.import_grpc(spec),
            "asyncapi" => self.import_asyncapi(spec),
            "a2a" => self.import_a2a(spec),
            _ => (HashMap::new(), vec![]),
        };
        Ok(BridgeImportResult {
            format: fmt,
            workflow,
            source_spec: spec.clone(),
            warnings,
        })
    }

    fn export_openapi(
        &self,
        workflow: &HashMap<String, serde_json::Value>,
    ) -> (serde_json::Value, Vec<String>) {
        let wf = serde_json::Value::Object(workflow.clone().into_iter().collect());
        let mut warnings = Vec::new();
        let wf_id = get_str(&wf, "id")
            .unwrap_or_else(|| get_str(&wf, "name").unwrap_or_else(|| "_unknown".to_string()));
        let mut paths = HashMap::new();
        let mut schemas = HashMap::new();
        let mut step_idx = 0;

        let steps = get_array(&wf, "steps");
        for step_raw in steps {
            let step: HashMap<String, serde_json::Value> = step_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let step_name = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| format!("step-{}", step_idx));
            let path = format!("/{}", step_name);
            step_idx += 1;
            let request_body = serde_json::json!({
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {"input": {"type": "string"}}
                        }
                    }
                }
            });
            let responses = serde_json::json!({
                "200": {
                    "description": "Success",
                    "content": {
                        "application/json": {
                            "schema": {"type": "object"}
                        }
                    }
                }
            });
            paths.insert(
                path.clone(),
                serde_json::json!({
                    "post": {
                        "operationId": format!("{}.{}", wf_id, step_name),
                        "requestBody": request_body,
                        "responses": responses
                    }
                }),
            );
            let schema_name = format!("{}.{}.Request", wf_id, step_name);
            schemas.insert(
                schema_name,
                serde_json::json!({
                    "type": "object",
                    "properties": {"input": {"type": "string"}},
                    "required": ["input"]
                }),
            );
        }

        if paths.is_empty() {
            warnings.push("Workflow has no steps; OpenAPI spec will be empty.".to_string());
        }

        let spec = serde_json::json!({
            "openapi": "3.0.0",
            "info": {"title": format!("ALP Workflow: {}", wf_id), "version": "1.0.0"},
            "paths": paths,
            "components": {"schemas": schemas}
        });
        (spec, warnings)
    }

    fn import_openapi(
        &self,
        spec: &serde_json::Value,
    ) -> (HashMap<String, serde_json::Value>, Vec<String>) {
        let mut warnings = Vec::new();
        let info = get_object(spec, "info");
        let title = get_str_map(&serde_json::Value::Object(info.clone().into_iter().collect()))
            .unwrap_or_else(|| "imported-workflow".to_string());
        let wf_id = title.replace(" ", "-").to_lowercase();
        let mut steps = Vec::new();

        let paths = get_object(spec, "paths");
        for (path, methods_raw) in paths {
            let methods = methods_raw.as_object();
            if let Some(methods) = methods {
                for (_, details_raw) in methods {
                    let details = details_raw.as_object();
                    if let Some(details) = details {
                        let details_map: HashMap<String, serde_json::Value> = details.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
                        let op_id = get_str_map(&serde_json::Value::Object(details_map.into_iter().collect()))
                            .unwrap_or_else(|| path.trim_start_matches('/').to_string());
                        steps.push(serde_json::json!({"id": op_id, "name": op_id, "type": "step"}));
                        break;
                    }
                }
            }
        }

        let mut workflow = HashMap::new();
        workflow.insert("id".to_string(), serde_json::Value::String(wf_id));
        workflow.insert("name".to_string(), serde_json::Value::String(title));
        workflow.insert(
            "source_format".to_string(),
            serde_json::Value::String("openapi".to_string()),
        );
        workflow.insert("steps".to_string(), serde_json::Value::Array(steps));
        if workflow
            .get("steps")
            .and_then(|v| v.as_array())
            .map(|a| a.is_empty())
            .unwrap_or(true)
        {
            warnings.push("No paths found in OpenAPI spec.".to_string());
        }
        (workflow, warnings)
    }

    fn export_graphql(
        &self,
        workflow: &HashMap<String, serde_json::Value>,
    ) -> (serde_json::Value, Vec<String>) {
        let wf = serde_json::Value::Object(workflow.clone().into_iter().collect());
        let warnings = Vec::new();
        let wf_id = get_str(&wf, "id")
            .unwrap_or_else(|| get_str(&wf, "name").unwrap_or_else(|| "_unknown".to_string()))
            .replace("-", "_");
        let type_name = format!("{}Workflow", wf_id);
        let mut lines = vec![format!("type {} {{", type_name)];
        let steps = get_array(&wf, "steps");
        for step_raw in steps {
            let step: HashMap<String, serde_json::Value> = step_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let name = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| "step".to_string())
                .replace("-", "_");
            lines.push(format!("  {}: String", name));
        }
        lines.push("}".to_string());
        lines.push("".to_string());
        lines.push("type Query {".to_string());
        lines.push(format!("  {}: {}", wf_id, type_name));
        lines.push("}".to_string());
        (serde_json::Value::String(lines.join("\n")), warnings)
    }

    fn import_graphql(
        &self,
        spec: &serde_json::Value,
    ) -> (HashMap<String, serde_json::Value>, Vec<String>) {
        let mut warnings = Vec::new();
        let sdl = match spec {
            serde_json::Value::String(s) => s.clone(),
            _ => spec.to_string(),
        };
        let mut steps = Vec::new();
        for line in sdl.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with("type ") || line == "}" {
                continue;
            }
            if line.contains(": ") && !line.starts_with("#") {
                let field_name = line
                    .split(':')
                    .next()
                    .unwrap_or("")
                    .trim()
                    .trim_start_matches('{')
                    .trim();
                if !field_name.is_empty() {
                    steps.push(
                        serde_json::json!({"id": field_name, "name": field_name, "type": "step"}),
                    );
                }
            }
        }
        let mut workflow = HashMap::new();
        workflow.insert(
            "id".to_string(),
            serde_json::Value::String("imported-graphql-workflow".to_string()),
        );
        workflow.insert(
            "name".to_string(),
            serde_json::Value::String("Imported GraphQL Workflow".to_string()),
        );
        workflow.insert(
            "source_format".to_string(),
            serde_json::Value::String("graphql".to_string()),
        );
        workflow.insert("steps".to_string(), serde_json::Value::Array(steps));
        if workflow
            .get("steps")
            .and_then(|v| v.as_array())
            .map(|a| a.is_empty())
            .unwrap_or(true)
        {
            warnings.push("No fields found in GraphQL SDL.".to_string());
        }
        (workflow, warnings)
    }

    fn export_grpc(
        &self,
        workflow: &HashMap<String, serde_json::Value>,
    ) -> (serde_json::Value, Vec<String>) {
        let wf = serde_json::Value::Object(workflow.clone().into_iter().collect());
        let warnings = Vec::new();
        let wf_id = get_str(&wf, "id")
            .unwrap_or_else(|| get_str(&wf, "name").unwrap_or_else(|| "_unknown".to_string()))
            .replace("-", "_");
        let service_name = format!("{}Service", wf_id);
        let mut lines = vec![
            r#"syntax = "proto3";"#.to_string(),
            "".to_string(),
            "package alp;".to_string(),
            "".to_string(),
            format!("service {} {{", service_name),
        ];
        let steps = get_array(&wf, "steps");
        for step_raw in &steps {
            let step: HashMap<String, serde_json::Value> = step_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let name = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| "step".to_string())
                .replace("-", "_");
            lines.push(format!(
                "  rpc {}({}Request) returns ({}Response);",
                name, name, name
            ));
        }
        lines.push("}".to_string());
        lines.push("".to_string());
        for step_raw in &steps {
            let step: HashMap<String, serde_json::Value> = step_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let name = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| "step".to_string())
                .replace("-", "_");
            lines.push(format!("message {}Request {{", name));
            lines.push("  string input = 1;".to_string());
            lines.push("}".to_string());
            lines.push(format!("message {}Response {{", name));
            lines.push("  string output = 1;".to_string());
            lines.push("}".to_string());
            lines.push("".to_string());
        }
        (serde_json::Value::String(lines.join("\n")), warnings)
    }

    fn import_grpc(
        &self,
        spec: &serde_json::Value,
    ) -> (HashMap<String, serde_json::Value>, Vec<String>) {
        let mut warnings = Vec::new();
        let proto = match spec {
            serde_json::Value::String(s) => s.clone(),
            _ => spec.to_string(),
        };
        let mut steps = Vec::new();
        for line in proto.lines() {
            let line = line.trim();
            if line.starts_with("rpc ") && line.contains('(') {
                let rpc_name = line
                    .split('(')
                    .next()
                    .unwrap_or("")
                    .replace("rpc ", "")
                    .trim()
                    .to_string();
                if !rpc_name.is_empty() {
                    steps.push(
                        serde_json::json!({"id": rpc_name, "name": rpc_name, "type": "step"}),
                    );
                }
            }
        }
        let mut workflow = HashMap::new();
        workflow.insert(
            "id".to_string(),
            serde_json::Value::String("imported-grpc-workflow".to_string()),
        );
        workflow.insert(
            "name".to_string(),
            serde_json::Value::String("Imported gRPC Workflow".to_string()),
        );
        workflow.insert(
            "source_format".to_string(),
            serde_json::Value::String("grpc".to_string()),
        );
        workflow.insert("steps".to_string(), serde_json::Value::Array(steps));
        if workflow
            .get("steps")
            .and_then(|v| v.as_array())
            .map(|a| a.is_empty())
            .unwrap_or(true)
        {
            warnings.push("No RPC methods found in proto spec.".to_string());
        }
        (workflow, warnings)
    }

    fn export_asyncapi(
        &self,
        workflow: &HashMap<String, serde_json::Value>,
    ) -> (serde_json::Value, Vec<String>) {
        let wf = serde_json::Value::Object(workflow.clone().into_iter().collect());
        let mut warnings = Vec::new();
        let wf_id = get_str(&wf, "id")
            .unwrap_or_else(|| get_str(&wf, "name").unwrap_or_else(|| "_unknown".to_string()));
        let mut channels = HashMap::new();
        let steps = get_array(&wf, "steps");
        for step_raw in steps {
            let step: HashMap<String, serde_json::Value> = step_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let name = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| "step".to_string());
            let channel_name = format!("{}/{}", wf_id, name);
            channels.insert(channel_name, serde_json::json!({
                "publish": {
                    "message": {
                        "name": format!("{}Request", name),
                        "payload": {"type": "object", "properties": {"input": {"type": "string"}}}
                    }
                },
                "subscribe": {
                    "message": {
                        "name": format!("{}Response", name),
                        "payload": {"type": "object", "properties": {"output": {"type": "string"}}}
                    }
                }
            }));
        }
        let spec = serde_json::json!({
            "asyncapi": "2.0.0",
            "info": {"title": format!("ALP Workflow: {}", wf_id), "version": "1.0.0"},
            "channels": channels
        });
        if channels.is_empty() {
            warnings.push("Workflow has no steps; AsyncAPI spec will be empty.".to_string());
        }
        (spec, warnings)
    }

    fn import_asyncapi(
        &self,
        spec: &serde_json::Value,
    ) -> (HashMap<String, serde_json::Value>, Vec<String>) {
        let mut warnings = Vec::new();
        let info = get_object(spec, "info");
        let title = get_str_map(&serde_json::Value::Object(info.clone().into_iter().collect()))
            .unwrap_or_else(|| "imported-asyncapi-workflow".to_string());
        let wf_id = title.replace(" ", "-").to_lowercase();
        let mut steps = Vec::new();

        let channels = get_object(spec, "channels");
        for channel_raw in channels.values() {
            let channel = channel_raw.as_object();
            if let Some(channel) = channel {
                let pub_msg: HashMap<String, serde_json::Value> = channel.get("publish")
                    .and_then(|v| v.as_object())
                    .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                    .unwrap_or_default();
                let msg: HashMap<String, serde_json::Value> = pub_msg.get("message")
                    .and_then(|v| v.as_object())
                    .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                    .unwrap_or_default();
                let name = get_str_map(&serde_json::Value::Object(msg.clone().into_iter().collect()))
                    .unwrap_or_else(|| "step".to_string());
                steps.push(serde_json::json!({"id": name, "name": name, "type": "step"}));
            }
        }

        let mut workflow = HashMap::new();
        workflow.insert("id".to_string(), serde_json::Value::String(wf_id));
        workflow.insert("name".to_string(), serde_json::Value::String(title));
        workflow.insert(
            "source_format".to_string(),
            serde_json::Value::String("asyncapi".to_string()),
        );
        workflow.insert("steps".to_string(), serde_json::Value::Array(steps));
        if workflow
            .get("steps")
            .and_then(|v| v.as_array())
            .map(|a| a.is_empty())
            .unwrap_or(true)
        {
            warnings.push("No channels found in AsyncAPI spec.".to_string());
        }
        (workflow, warnings)
    }

    fn export_a2a(
        &self,
        workflow: &HashMap<String, serde_json::Value>,
    ) -> (serde_json::Value, Vec<String>) {
        let wf = serde_json::Value::Object(workflow.clone().into_iter().collect());
        let warnings = Vec::new();
        let wf_id = get_str(&wf, "id").unwrap_or_else(|| {
            get_str(&wf, "name").unwrap_or_else(|| "alp-workflow".to_string())
        });
        let mut agent_card = HashMap::new();
        agent_card.insert(
            "@context".to_string(),
            serde_json::Value::String("https://a2a-protocol.org/v1".to_string()),
        );
        agent_card.insert(
            "@type".to_string(),
            serde_json::Value::String("AgentCard".to_string()),
        );
        agent_card.insert("id".to_string(), serde_json::Value::String(wf_id.clone()));
        agent_card.insert(
            "name".to_string(),
            serde_json::Value::String(get_str(&wf, "name").unwrap_or_else(|| wf_id.clone())),
        );
        agent_card.insert(
            "description".to_string(),
            serde_json::Value::String(
                get_str(&wf, "description")
                    .unwrap_or_else(|| "ALP-generated A2A agent".to_string()),
            ),
        );
        agent_card.insert(
            "capabilities".to_string(),
            serde_json::json!({"streaming": false, "pushNotifications": false}),
        );
        agent_card.insert("skills".to_string(), serde_json::Value::Array(Vec::new()));

        let steps = get_array(&wf, "steps");
        for (idx, step_raw) in steps.iter().enumerate() {
            let step: HashMap<String, serde_json::Value> = step_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let skill_id = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| format!("skill-{:x}", idx));
            let skill_name = get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                .unwrap_or_else(|| "Unknown Skill".to_string());
            let skills = agent_card
                .get_mut("skills")
                .unwrap()
                .as_array_mut()
                .unwrap();
            skills.push(serde_json::json!({
                "id": skill_id,
                "name": skill_name,
                "description": get_str_map(&serde_json::Value::Object(step.clone().into_iter().collect()))
                    .unwrap_or_else(|| format!("Step from {}", wf_id))
            }));
        }
        (serde_json::Value::Object(agent_card.into_iter().collect()), warnings)
    }

    fn import_a2a(
        &self,
        spec: &serde_json::Value,
    ) -> (HashMap<String, serde_json::Value>, Vec<String>) {
        let mut warnings = Vec::new();
        let obj: HashMap<String, serde_json::Value> = spec.as_object()
            .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
            .unwrap_or_default();
        let agent_id = get_str_map(&serde_json::Value::Object(obj.clone().into_iter().collect()))
            .unwrap_or_else(|| "imported-a2a-agent".to_string());
        let skills = get_array_from_obj(&serde_json::Value::Object(obj.clone().into_iter().collect()), "skills");
        let mut steps = Vec::new();
        for (idx, skill_raw) in skills.iter().enumerate() {
            let skill: HashMap<String, serde_json::Value> = skill_raw.as_object()
                .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
                .unwrap_or_default();
            let step_id = get_str_map(&serde_json::Value::Object(skill.clone().into_iter().collect()))
                .unwrap_or_else(|| format!("step-{:x}", idx));
            let step_name = get_str_map(&serde_json::Value::Object(skill.clone().into_iter().collect()))
                .unwrap_or_else(|| "Imported Step".to_string());
            steps.push(serde_json::json!({
                "id": step_id,
                "name": step_name,
                "type": "step",
                "description": get_str_map(&serde_json::Value::Object(skill.clone().into_iter().collect()))
                    .unwrap_or_else(|| "".to_string())
            }));
        }
        let mut workflow = HashMap::new();
        workflow.insert(
            "id".to_string(),
            serde_json::Value::String(agent_id.clone()),
        );
        workflow.insert(
            "name".to_string(),
            serde_json::Value::String(get_str_map(&serde_json::Value::Object(obj.into_iter().collect()))
                .unwrap_or_else(|| agent_id)),
        );
        workflow.insert(
            "source_format".to_string(),
            serde_json::Value::String("a2a".to_string()),
        );
        workflow.insert("steps".to_string(), serde_json::Value::Array(steps));
        if workflow
            .get("steps")
            .and_then(|v| v.as_array())
            .map(|a| a.is_empty())
            .unwrap_or(true)
        {
            warnings.push("No skills found in A2A agent card.".to_string());
        }
        (workflow, warnings)
    }
}

fn get_str(map: &serde_json::Value, key: &str) -> Option<String> {
    map.get(key).and_then(|v| v.as_str().map(|s| s.to_string()))
}

fn get_str_map(map: &serde_json::Value) -> Option<String> {
    get_str(map, "name").or_else(|| get_str(map, "id"))
}

fn get_object(map: &serde_json::Value, key: &str) -> HashMap<String, serde_json::Value> {
    map.get(key)
        .and_then(|v| v.as_object())
        .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        .unwrap_or_default()
}

fn get_array(map: &serde_json::Value, key: &str) -> Vec<serde_json::Value> {
    map.get(key)
        .and_then(|v| v.as_array())
        .map(|a| a.clone())
        .unwrap_or_default()
}

fn get_array_from_obj(map: &serde_json::Value, key: &str) -> Vec<serde_json::Value> {
    get_array(map, key)
}

impl Default for ProtocolBridge {
    fn default() -> Self {
        Self::new()
    }
}

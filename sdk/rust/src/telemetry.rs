use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Span {
    pub id: String,
    pub trace_id: String,
    pub span_id: String,
    pub parent_span_id: Option<String>,
    pub agent: Option<String>,
    pub action: String,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub duration_ms: Option<i64>,
    pub status: String,
    pub attributes: HashMap<String, serde_json::Value>,
}

#[allow(clippy::too_many_arguments)]
impl Span {
    pub fn new(
        id: impl Into<String>,
        trace_id: impl Into<String>,
        span_id: impl Into<String>,
        parent_span_id: Option<String>,
        agent: Option<String>,
        action: impl Into<String>,
        start_time: i64,
        status: impl Into<String>,
        attributes: HashMap<String, serde_json::Value>,
    ) -> Self {
        Self {
            id: id.into(),
            trace_id: trace_id.into(),
            span_id: span_id.into(),
            parent_span_id,
            agent,
            action: action.into(),
            start_time,
            end_time: None,
            duration_ms: None,
            status: status.into(),
            attributes,
        }
    }
}

impl Default for TelemetryEngine {
    fn default() -> Self {
        Self::new()
    }
}

pub struct TelemetryEngine {
    pub active_spans: HashMap<String, Span>,
    pub completed_spans: Vec<Span>,
}

impl TelemetryEngine {
    pub fn new() -> Self {
        Self {
            active_spans: HashMap::new(),
            completed_spans: Vec::new(),
        }
    }

    pub fn generate_trace_id(&self) -> String {
        simple_hash(&timestamp_now())
    }

    pub fn generate_span_id(&self) -> String {
        simple_hash(&timestamp_now()).chars().take(16).collect()
    }

    pub fn start_span(
        &mut self,
        action: impl Into<String>,
        opts: Option<HashMap<String, serde_json::Value>>,
    ) -> Span {
        let action = action.into();
        let mut opts = opts.unwrap_or_default();
        let trace_id = opts
            .remove("traceId")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| self.generate_trace_id());
        let span_id = opts
            .remove("spanId")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| self.generate_span_id());
        let parent_span_id = opts
            .remove("parentSpanId")
            .and_then(|v| v.as_str().map(|s| s.to_string()));
        let agent = opts
            .remove("agent")
            .and_then(|v| v.as_str().map(|s| s.to_string()));
        let attributes = opts
            .remove("attributes")
            .and_then(|v| {
                v.as_object()
                    .map(|o| o.into_iter().map(|(k, v)| (k.clone(), v.clone())).collect())
            })
            .unwrap_or_default();

        let span = Span::new(
            format!("span-{}", span_id),
            trace_id.clone(),
            span_id.clone(),
            parent_span_id,
            agent,
            action,
            timestamp_ms(),
            "UNSET",
            attributes,
        );
        self.active_spans.insert(span_id.clone(), span.clone());
        span
    }

    pub fn end_span(
        &mut self,
        span_id: &str,
        status: impl Into<String>,
        attributes: Option<HashMap<String, serde_json::Value>>,
    ) -> Option<Span> {
        if let Some(mut span) = self.active_spans.remove(span_id) {
            let end_time = timestamp_ms();
            span.end_time = Some(end_time);
            span.duration_ms = Some(end_time - span.start_time);
            span.status = status.into();
            if let Some(attrs) = attributes {
                for (k, v) in attrs {
                    span.attributes.insert(k, v);
                }
            }
            self.completed_spans.push(span.clone());
            Some(span)
        } else {
            None
        }
    }

    pub fn inject_context(&self, span: &Span) -> String {
        format!("00-{}-{}-01", span.trace_id, span.span_id)
    }

    pub fn extract_context(&self, traceparent: &str) -> Option<HashMap<String, String>> {
        let parts: Vec<&str> = traceparent.split('-').collect();
        if parts.len() < 4 || parts[0] != "00" {
            return None;
        }
        let mut result = HashMap::new();
        result.insert("traceId".into(), parts[1].into());
        result.insert("parentSpanId".into(), parts[2].into());
        Some(result)
    }

    pub fn export_otlp(&self) -> HashMap<String, serde_json::Value> {
        let mut scope_spans = Vec::new();
        let mut spans = Vec::new();
        for s in &self.completed_spans {
            let mut span_map = HashMap::new();
            span_map.insert(
                "traceId".into(),
                serde_json::Value::String(s.trace_id.clone()),
            );
            span_map.insert(
                "spanId".into(),
                serde_json::Value::String(s.span_id.clone()),
            );
            span_map.insert(
                "parentSpanId".into(),
                serde_json::Value::String(s.parent_span_id.clone().unwrap_or_default()),
            );
            span_map.insert("name".into(), serde_json::Value::String(s.action.clone()));
            span_map.insert("kind".into(), serde_json::Value::Number(1.into()));
            span_map.insert(
                "startTimeUnixNano".into(),
                serde_json::Value::String(format!("{}", s.start_time * 1000000)),
            );
            let end_time = s.end_time.unwrap_or(s.start_time);
            span_map.insert(
                "endTimeUnixNano".into(),
                serde_json::Value::String(format!("{}", end_time * 1000000)),
            );
            let status_code = match s.status.as_str() {
                "OK" => 1,
                "ERROR" => 2,
                _ => 0,
            };
            span_map.insert("status".into(), serde_json::json!({"code": status_code}));
            let attrs: Vec<HashMap<String, serde_json::Value>> = s
                .attributes
                .iter()
                .map(|(k, v)| {
                    let mut attr = HashMap::new();
                    attr.insert("key".into(), serde_json::Value::String(k.clone()));
                    attr.insert(
                        "value".into(),
                        serde_json::json!({"stringValue": v.to_string()}),
                    );
                    attr
                })
                .collect();
            span_map.insert(
                "attributes".into(),
                serde_json::Value::Array(
                    attrs
                        .into_iter()
                        .map(|a| serde_json::Value::Object(a.into_iter().collect()))
                        .collect(),
                ),
            );
            spans.push(serde_json::Value::Object(span_map.into_iter().collect()));
        }
        let scope = HashMap::from([
            (
                "name".into(),
                serde_json::Value::String("@autonomous-lifecycle-protocol-alp/telemetry".into()),
            ),
            ("version".into(), serde_json::Value::String("17.0.0".into())),
        ]);
        let scope_span = HashMap::from([
            (
                "scope".into(),
                serde_json::Value::Object(scope.into_iter().collect()),
            ),
            ("spans".into(), serde_json::Value::Array(spans)),
        ]);
        scope_spans.push(serde_json::Value::Object(scope_span.into_iter().collect()));

        let resource_attrs = vec![
            HashMap::from([
                (
                    "key".into(),
                    serde_json::Value::String("service.name".into()),
                ),
                (
                    "value".into(),
                    serde_json::json!({"stringValue": "alp-execution-engine"}),
                ),
            ]),
            HashMap::from([
                (
                    "key".into(),
                    serde_json::Value::String("telemetry.sdk.name".into()),
                ),
                (
                    "value".into(),
                    serde_json::json!({"stringValue": "alp-telemetry"}),
                ),
            ]),
        ];
        let resource = HashMap::from([(
            "attributes".into(),
            serde_json::Value::Array(
                resource_attrs
                    .into_iter()
                    .map(|a| serde_json::Value::Object(a.into_iter().collect()))
                    .collect(),
            ),
        )]);
        let resource_span = HashMap::from([
            (
                "resource".into(),
                serde_json::Value::Object(resource.into_iter().collect()),
            ),
            ("scopeSpans".into(), serde_json::Value::Array(scope_spans)),
        ]);

        let mut otlp = HashMap::new();
        otlp.insert(
            "resourceSpans".into(),
            serde_json::Value::Array(vec![serde_json::Value::Object(
                resource_span.into_iter().collect(),
            )]),
        );
        otlp
    }

    pub fn get_trace_summary(&self) -> HashMap<String, usize> {
        let mut ok_count = 0;
        let mut error_count = 0;
        for s in &self.completed_spans {
            if s.status == "OK" {
                ok_count += 1;
            } else if s.status == "ERROR" {
                error_count += 1;
            }
        }
        let mut summary = HashMap::new();
        summary.insert(
            "totalSpans".into(),
            self.completed_spans.len() + self.active_spans.len(),
        );
        summary.insert("activeSpans".into(), self.active_spans.len());
        summary.insert("okCount".into(), ok_count);
        summary.insert("errorCount".into(), error_count);
        summary
    }

    pub fn get_completed_spans(&self) -> Vec<Span> {
        self.completed_spans.clone()
    }
}

fn timestamp_now() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    now.as_millis().to_string()
}

fn timestamp_ms() -> i64 {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    now.as_millis() as i64
}

fn simple_hash(input: &str) -> String {
    let mut hash: u64 = 0;
    for byte in input.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
    }
    format!("{:x}", hash)
}

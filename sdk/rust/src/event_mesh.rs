use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct MeshEvent {
    pub id: String,
    pub topic: String,
    pub sender_agent: String,
    pub payload: String,
    pub event_type: String,
    pub timestamp: String,
}

impl MeshEvent {
    pub fn new(
        id: impl Into<String>,
        topic: impl Into<String>,
        sender_agent: impl Into<String>,
        payload: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            topic: topic.into(),
            sender_agent: sender_agent.into(),
            payload: payload.into(),
            event_type: "state_change".into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

pub type EventHandler = Box<dyn Fn(&MeshEvent) + Send + Sync>;

pub struct EventMeshEngine {
    subscriptions: HashMap<String, Vec<EventHandler>>,
    event_buffer: Vec<MeshEvent>,
}

impl EventMeshEngine {
    pub fn new() -> Self {
        Self {
            subscriptions: HashMap::new(),
            event_buffer: Vec::new(),
        }
    }

    pub fn subscribe<F>(&mut self, topic: impl Into<String>, handler: F)
    where
        F: Fn(&MeshEvent) + Send + Sync + 'static,
    {
        self.subscriptions
            .entry(topic.into())
            .or_default()
            .push(Box::new(handler));
    }

    pub fn publish(
        &mut self,
        event_id: impl Into<String>,
        topic: impl Into<String>,
        sender_agent: impl Into<String>,
        payload: impl Into<String>,
    ) -> MeshEvent {
        let event = MeshEvent::new(event_id, topic, sender_agent, payload);
        self.event_buffer.push(event.clone());
        if let Some(handlers) = self.subscriptions.get(&event.topic) {
            for handler in handlers {
                handler(&event);
            }
        }
        event
    }

    pub fn event_buffer(&self) -> &[MeshEvent] {
        &self.event_buffer
    }
}

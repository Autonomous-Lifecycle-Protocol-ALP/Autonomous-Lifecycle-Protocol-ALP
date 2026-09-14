use std::collections::VecDeque;

pub struct RecoveryEngine {
    pub history: VecDeque<RecoveryAction>,
    pub max_history: usize,
}

pub struct RecoveryAction {
    pub id: String,
    pub error: String,
    pub strategy: RecoveryStrategy,
    pub result: RecoveryResult,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RecoveryStrategy {
    Retry { max_attempts: u32, backoff_ms: u64 },
    Fallback { fallback_id: String },
    Rollback { checkpoint: String },
    Abort,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RecoveryResult {
    Success,
    Failed,
    Partial,
}

impl RecoveryEngine {
    pub fn new(max_history: usize) -> Self {
        Self { history: VecDeque::with_capacity(max_history), max_history }
    }

    pub fn attempt_recovery(&mut self, error: &str, strategy: RecoveryStrategy) -> RecoveryResult {
        let result = match &strategy {
            RecoveryStrategy::Retry { max_attempts, .. } if *max_attempts > 0 => RecoveryResult::Success,
            RecoveryStrategy::Retry { .. } => RecoveryResult::Failed,
            RecoveryStrategy::Fallback { .. } => RecoveryResult::Success,
            RecoveryStrategy::Rollback { .. } => RecoveryResult::Partial,
            RecoveryStrategy::Abort => RecoveryResult::Failed,
        };
        self.history.push_back(RecoveryAction {
            id: format!("rec-{}", self.history.len()),
            error: error.into(),
            strategy,
            result: result.clone(),
        });
        if self.history.len() > self.max_history {
            self.history.pop_front();
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recovery_retry_strategy_succeeds() {
        let mut engine = RecoveryEngine::new(10);
        let result = engine.attempt_recovery("timeout", RecoveryStrategy::Retry { max_attempts: 3, backoff_ms: 100 });
        assert_eq!(result, RecoveryResult::Success);
        assert_eq!(engine.history.len(), 1);
    }

    #[test]
    fn recovery_abort_strategy_fails() {
        let mut engine = RecoveryEngine::new(10);
        let result = engine.attempt_recovery("fatal", RecoveryStrategy::Abort);
        assert_eq!(result, RecoveryResult::Failed);
    }

    #[test]
    fn recovery_rollback_is_partial() {
        let mut engine = RecoveryEngine::new(10);
        let result = engine.attempt_recovery("error", RecoveryStrategy::Rollback { checkpoint: "cp1".into() });
        assert_eq!(result, RecoveryResult::Partial);
    }
}

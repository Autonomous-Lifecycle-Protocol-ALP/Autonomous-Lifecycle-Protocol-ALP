pub mod task;
pub mod config;
pub mod hardware;
pub mod context_engine;
pub mod task_manager;
pub mod orchestrator;

pub use config::{ConfigLoader, HydraConfig};
pub use hardware::HardwareProfile;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::task::Task;
    use crate::task_manager::TaskManager;
    use crate::context_engine::{ContextEngine, ContextSlice};

    #[test]
    fn task_new_has_uuid_id() {
        let task = Task::new("test goal");
        assert!(!task.id.is_empty());
        assert_eq!(task.goal, "test goal");
        assert!(task.result.is_none());
    }

    #[test]
    fn task_manager_submit_and_complete() {
        let mut tm = TaskManager::new();
        let task = Task::new("demo");
        let id = tm.submit(task);
        assert_eq!(tm.tasks.len(), 1);
        assert_eq!(tm.queue.len(), 1);
        tm.complete(&id, "done");
        assert_eq!(tm.tasks[0].result, Some("done".into()));
    }

    #[test]
    fn hardware_profile_has_cpu_cores() {
        let hw = HardwareProfile::detect();
        assert!(hw.cpu_cores > 0);
        assert_eq!(hw.arch, std::env::consts::ARCH);
    }

    #[test]
    fn context_engine_builds_prompt() {
        let mut engine = ContextEngine::new(100);
        engine.add("key", ContextSlice { source: "test".into(), content: "hello".into(), tokens_estimate: 10 });
        let prompt = engine.build_prompt("key", "query");
        assert!(prompt.contains("hello"));
        assert!(prompt.ends_with("query"));
    }
}

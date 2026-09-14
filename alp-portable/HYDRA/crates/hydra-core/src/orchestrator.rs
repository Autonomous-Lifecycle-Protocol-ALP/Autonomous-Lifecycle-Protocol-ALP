use crate::task::Task;
use crate::task_manager::TaskManager;
use hydra_runtime::ModelRouter;

pub struct Orchestrator {
    pub router: ModelRouter,
    pub tasks: TaskManager,
}

impl Orchestrator {
    pub fn new(router: ModelRouter, tasks: TaskManager) -> Self {
        Self { router, tasks }
    }

    pub fn run_goal(&mut self, goal: &str) -> String {
        let task = Task::new(goal);
        let id = self.tasks.submit(task);
        id
    }
}

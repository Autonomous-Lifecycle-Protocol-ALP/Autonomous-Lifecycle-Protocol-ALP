use std::collections::VecDeque;
use crate::task::Task;

pub struct TaskManager {
    pub tasks: Vec<Task>,
    pub queue: VecDeque<String>,
}

impl TaskManager {
    pub fn new() -> Self {
        Self { tasks: Vec::new(), queue: VecDeque::new() }
    }

    pub fn submit(&mut self, task: Task) -> String {
        let id = task.id.clone();
        self.tasks.push(task);
        self.queue.push_back(id.clone());
        id
    }

    pub fn complete(&mut self, task_id: &str, result: &str) {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == task_id) {
            task.result = Some(result.into());
        }
    }
}

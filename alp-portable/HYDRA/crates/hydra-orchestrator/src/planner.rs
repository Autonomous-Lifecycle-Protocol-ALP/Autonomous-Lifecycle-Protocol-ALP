pub struct Step {
    pub id: String,
    pub description: String,
    pub status: StepStatus,
}

#[derive(Debug, Clone, PartialEq)]
pub enum StepStatus {
    Pending,
    Running,
    Completed(String),
    Failed(String),
}

impl Step {
    pub fn new(id: impl Into<String>, description: impl Into<String>) -> Self {
        Self { id: id.into(), description: description.into(), status: StepStatus::Pending }
    }
}

pub struct Plan {
    pub goal: String,
    pub steps: Vec<Step>,
}

impl Plan {
    pub fn new(goal: impl Into<String>) -> Self {
        Self { goal: goal.into(), steps: Vec::new() }
    }

    pub fn add_step(&mut self, step: Step) {
        self.steps.push(step);
    }
}

use crate::planner::{Plan, Step, StepStatus};

pub struct Executor;

impl Executor {
    pub fn execute_step(&self, step: &mut Step, context: &str) -> Result<String, String> {
        step.status = StepStatus::Running;
        let prompt = format!("Goal context: {context}\nStep: {}\nExecute this step and return the result.", step.description);
        let result = format!("[executed] {prompt}");
        step.status = StepStatus::Completed(result.clone());
        Ok(result)
    }

    pub fn execute_plan(&self, plan: &mut Plan, context: &str) -> Result<String, String> {
        let mut results = Vec::new();
        for step in &mut plan.steps {
            match self.execute_step(step, context) {
                Ok(output) => results.push(output),
                Err(e) => {
                    step.status = StepStatus::Failed(e.clone());
                    return Err(e);
                }
            }
        }
        Ok(results.join("\n"))
    }
}

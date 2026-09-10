use std::collections::VecDeque;
use tokio::sync::RwLock;
use std::sync::Arc;

pub struct Job {
    pub id: String,
    pub payload: String,
    pub status: JobStatus,
}

#[derive(Debug, Clone, PartialEq)]
pub enum JobStatus {
    Queued,
    Running,
    Completed(String),
    Failed(String),
}

impl Job {
    pub fn new(id: impl Into<String>, payload: impl Into<String>) -> Self {
        Self { id: id.into(), payload: payload.into(), status: JobStatus::Queued }
    }
}

pub struct Scheduler {
    pub queue: Arc<RwLock<VecDeque<Job>>>,
    pub max_concurrency: usize,
    pub active: Arc<RwLock<usize>>,
}

impl Scheduler {
    pub fn new(max_concurrency: usize) -> Self {
        Self {
            queue: Arc::new(RwLock::new(VecDeque::new())),
            max_concurrency,
            active: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn enqueue(&self, job: Job) -> String {
        let mut queue = self.queue.write().await;
        queue.push_back(job);
        queue.back().map(|j| j.id.clone()).unwrap_or_default()
    }

    pub async fn process_next<F>(&self, handler: F) -> Option<JobStatus>
    where
        F: FnOnce(String) -> Result<String, String> + Send + Sync + 'static,
    {
        let mut queue = self.queue.write().await;
        let mut active = self.active.write().await;
        if *active >= self.max_concurrency {
            return None;
        }
        if let Some(mut job) = queue.pop_front() {
            *active += 1;
            job.status = JobStatus::Running;
            drop(active);
            let payload = job.payload.clone();
            drop(queue);
            match handler(payload) {
                Ok(output) => {
                    let mut active = self.active.write().await;
                    *active -= 1;
                    Some(JobStatus::Completed(output))
                }
                Err(err) => {
                    let mut active = self.active.write().await;
                    *active -= 1;
                    Some(JobStatus::Failed(err))
                }
            }
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn scheduler_enqueues_job() {
        let scheduler = Scheduler::new(2);
        let job = Job::new("job-1", "payload");
        let id = scheduler.enqueue(job).await;
        assert_eq!(id, "job-1");
        let queue = scheduler.queue.read().await;
        assert_eq!(queue.len(), 1);
    }

    #[tokio::test]
    async fn scheduler_respects_concurrency() {
        let scheduler = Scheduler::new(1);
        let job1 = Job::new("job-1", "p1");
        let job2 = Job::new("job-2", "p2");
        scheduler.enqueue(job1).await;
        scheduler.enqueue(job2).await;
        let result = scheduler.process_next(|p| Ok(format!("handled: {p}"))).await;
        assert!(result.is_some());
    }

    #[tokio::test]
    async fn scheduler_processes_failed_job() {
        let scheduler = Scheduler::new(2);
        scheduler.enqueue(Job::new("job-1", "p1")).await;
        let result = scheduler.process_next(|_| Err(String::from("handler error"))).await;
        assert_eq!(result, Some(JobStatus::Failed("handler error".into())));
    }

    #[tokio::test]
    async fn scheduler_processes_completed_job() {
        let scheduler = Scheduler::new(2);
        scheduler.enqueue(Job::new("job-1", "p1")).await;
        let result = scheduler.process_next(|p| Ok(format!("done: {p}"))).await;
        assert_eq!(result, Some(JobStatus::Completed("done: p1".into())));
    }
}

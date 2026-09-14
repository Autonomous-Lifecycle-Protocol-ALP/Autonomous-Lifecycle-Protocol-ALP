use std::time::Instant;

pub struct Benchmark {
    pub name: String,
    pub results: Vec<BenchmarkResult>,
}

#[derive(Debug, Clone)]
pub struct BenchmarkResult {
    pub id: String,
    pub duration_ms: u64,
    pub passed: bool,
    pub detail: String,
}

impl Benchmark {
    pub fn new(name: impl Into<String>) -> Self {
        Self { name: name.into(), results: Vec::new() }
    }

    pub fn run<F>(&mut self, id: impl Into<String>, f: F) -> BenchmarkResult
    where
        F: FnOnce() -> bool,
    {
        let start = Instant::now();
        let passed = f();
        let duration_ms = start.elapsed().as_millis() as u64;
        let result = BenchmarkResult {
            id: id.into(),
            duration_ms,
            passed,
            detail: if passed { "ok" } else { "failed" }.into(),
        };
        self.results.push(result.clone());
        result
    }

    pub fn summary(&self) -> BenchmarkSummary {
        let total = self.results.len();
        let passed = self.results.iter().filter(|r| r.passed).count();
        BenchmarkSummary { total, passed, failed: total - passed }
    }
}

pub struct BenchmarkSummary {
    pub total: usize,
    pub passed: usize,
    pub failed: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn benchmark_records_results() {
        let mut bench = Benchmark::new("test");
        let r1 = bench.run("case-1", || true);
        let r2 = bench.run("case-2", || false);
        assert!(r1.passed);
        assert!(!r2.passed);
        let summary = bench.summary();
        assert_eq!(summary.total, 2);
        assert_eq!(summary.passed, 1);
    }
}

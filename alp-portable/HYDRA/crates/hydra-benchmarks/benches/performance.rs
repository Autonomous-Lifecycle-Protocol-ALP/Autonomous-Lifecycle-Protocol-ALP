use std::time::Instant;
use hydra_benchmarks::Benchmark;

async fn bench_pipeline_creative_run(iterations: usize) {
    let hw = hydra_core::HardwareProfile::detect();
    let budget = hydra_runtime::ResourceBudget {
        max_ram_mb: hw.available_ram_mb.max(hw.total_ram_mb),
        max_cpu_percent: 80,
        timeout_seconds: 60,
    };
    let pipeline = hydra_orchestrator::CreativePipeline::new(
        hydra_runtime::ModelManager::new(),
        budget,
    );

    let mut bench = Benchmark::new("pipeline_creative_run");
    for i in 0..iterations {
        let start = Instant::now();
        let result = pipeline.run(&format!("benchmark goal {i}"));
        let duration = start.elapsed().as_millis() as u64;
        bench.results.push(hydra_benchmarks::BenchmarkResult {
            id: format!("run-{i}"),
            duration_ms: duration,
            passed: !result.goal.is_empty() && !result.summary.is_empty(),
            detail: format!("artifacts={}", result.artifacts.len()),
        });
    }
    let summary = bench.summary();
    println!("Benchmark pipeline_creative_run: {} passed / {} total", summary.passed, summary.total);
}

async fn bench_model_selector_lookup(iterations: usize) {
    let mut bench = Benchmark::new("model_selector_lookup");
    for i in 0..iterations {
        let start = Instant::now();
        let _model = hydra_runtime::select_model(4096);
        let duration = start.elapsed().as_millis() as u64;
        bench.results.push(hydra_benchmarks::BenchmarkResult {
            id: format!("lookup-{i}"),
            duration_ms: duration,
            passed: true,
            detail: "ok".into(),
        });
    }
    let summary = bench.summary();
    println!("Benchmark model_selector_lookup: {} passed / {} total", summary.passed, summary.total);
}

async fn bench_scheduler_throughput(iterations: usize) {
    let mut bench = Benchmark::new("scheduler_throughput");
    let scheduler = hydra_scheduler::Scheduler::new(4);
    for i in 0..iterations {
        let start = Instant::now();
        let _id = scheduler.enqueue(hydra_scheduler::Job::new(format!("job-{i}"), format!("payload-{i}"))).await;
        let duration = start.elapsed().as_millis() as u64;
        bench.results.push(hydra_benchmarks::BenchmarkResult {
            id: format!("enqueue-{i}"),
            duration_ms: duration,
            passed: true,
            detail: "ok".into(),
        });
    }
    let summary = bench.summary();
    println!("Benchmark scheduler_throughput: {} passed / {} total", summary.passed, summary.total);
}

#[tokio::main]
async fn main() {
    let iterations = 100;
    bench_pipeline_creative_run(iterations).await;
    bench_model_selector_lookup(iterations).await;
    bench_scheduler_throughput(iterations).await;
}

use clap::{Parser, Subcommand};
use hydra_core::{ConfigLoader, HardwareProfile};
use hydra_runtime::{Model, ModelManager, select_model};
use hydra_scheduler::{Job, Scheduler};
use hydra_agents::HeadRegistry;
use hydra_skills::SkillRegistry;
use hydra_sandbox::SandboxManager;
use hydra_security::SecurityKernel;
use hydra_evolution::EvolutionLab;
use hydra_daemon::HydraDaemon;
use hydra_daemon::proto::{
    TaskCreated, Event,
    hydra_daemon_client::HydraDaemonClient,
};
use hydra_orchestrator::CreativePipeline;

#[derive(Parser)]
#[command(name = "hydra")]
#[command(about = "HYDRA Portable CLI")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    Start,
    Chat,
    Status,
    Task {
        #[command(subcommand)]
        command: TaskCommands,
    },
    Sandbox {
        #[command(subcommand)]
        command: SandboxCommands,
    },
    Model {
        #[command(subcommand)]
        command: ModelCommands,
    },
    Creative {
        #[command(subcommand)]
        command: CreativeCommands,
    },
    Agent {
        #[command(subcommand)]
        command: AgentCommands,
    },
    Skill {
        #[command(subcommand)]
        command: SkillCommands,
    },
    Benchmark {
        #[command(subcommand)]
        command: BenchmarkCommands,
    },
    Grpc {
        #[command(subcommand)]
        command: GrpcCommands,
    },
    SecurityScan,
    EvolutionStatus,
    EmergencyStop,
}

#[derive(Subcommand)]
pub enum TaskCommands {
    List,
    Run { goal: String },
}

#[derive(Subcommand)]
pub enum SandboxCommands {
    List,
}

#[derive(Subcommand)]
pub enum ModelCommands {
    List,
    Run { prompt: String },
}

#[derive(Subcommand)]
pub enum CreativeCommands {
    Run { goal: String },
}

#[derive(Subcommand)]
pub enum AgentCommands {
    List,
}

#[derive(Subcommand)]
pub enum SkillCommands {
    List,
}

#[derive(Subcommand)]
pub enum BenchmarkCommands {
    Run,
}

#[derive(Subcommand)]
pub enum GrpcCommands {
    RunGoal { goal: String, addr: String },
    StreamEvents { addr: String },
}

fn print_status(cfg: &hydra_core::HydraConfig, hw: &HardwareProfile) {
    println!("HYDRA Portable v{}", env!("CARGO_PKG_VERSION"));
    println!();
    println!("Config:");
    println!("  root: {}", cfg.root);
    println!("  data_dir: {}", cfg.data_dir);
    println!("  model_dir: {}", cfg.model_dir);
    println!("  cache_dir: {}", cfg.cache_dir);
    println!("  log_level: {}", cfg.log_level);
    println!("  max_concurrency: {}", cfg.max_concurrency);
    println!("  network_enabled: {}", cfg.network_enabled);
    println!();
    println!("Hardware:");
    println!("  os: {}", hw.os);
    println!("  arch: {}", hw.arch);
    println!("  cpu_cores: {}", hw.cpu_cores);
    println!("  total_ram_mb: {}", hw.total_ram_mb);
    println!("  available_ram_mb: {}", hw.available_ram_mb);
    println!("  has_gpu: {}", hw.has_gpu);
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    let default_config_path = std::path::PathBuf::from("config/default.toml");
    let cfg = ConfigLoader::load_or_default(default_config_path);
    let hw = HardwareProfile::detect();

    match cli.command {
        Commands::Start => {
            println!("Starting HYDRA daemon...");
            print_status(&cfg, &hw);
            let daemon = HydraDaemon::new(cfg.clone()).await;
            daemon.start().await;
            println!("Daemon running. Press Ctrl+C to stop.");
            tokio::signal::ctrl_c().await.ok();
            daemon.stop().await;
            println!("HYDRA daemon stopped.");
        }
        Commands::Chat => println!("Chat mode (not yet implemented)"),
        Commands::Status => print_status(&cfg, &hw),
        Commands::Task { command } => match command {
            TaskCommands::List => {
                let scheduler = Scheduler::new(cfg.max_concurrency);
                let queue = scheduler.queue.read().await;
                if queue.is_empty() {
                    println!("No active tasks.");
                } else {
                    println!("Task queue:");
                    for job in queue.iter() {
                        println!("  - {}: {} ({:?})", job.id, job.payload, job.status);
                    }
                }
            }
            TaskCommands::Run { goal } => {
                println!("Running goal through daemon: {goal}");
                let daemon = HydraDaemon::new(cfg.clone()).await;
                daemon.start().await;
                let id = daemon.submit_task(goal.clone()).await;
                println!("Task submitted: {id}");
                for _ in 0..100 {
                    let status = daemon.status().await;
                    if status.tasks_processed > 0 {
                        println!("Task completed. Total processed: {}", status.tasks_processed);
                        daemon.stop().await;
                        return;
                    }
                    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                }
                println!("Task is still processing; stopping daemon.");
                daemon.stop().await;
            }
        },
        Commands::Sandbox { command } => match command {
            SandboxCommands::List => {
                let manager = SandboxManager::new();
                let sandboxes = manager.list();
                if sandboxes.is_empty() {
                    println!("No active sandboxes.");
                } else {
                    println!("Active sandboxes:");
                    for sb in sandboxes {
                        println!("  - {}: {:?}", sb.id, sb.state);
                    }
                }
            }
        },
        Commands::Model { command } => match command {
            ModelCommands::List => {
                let mut manager = ModelManager::new();
                let adapters = manager.discover(&cfg.model_dir);
                if adapters.is_empty() {
                    println!("No models found in {}", cfg.model_dir);
                } else {
                    println!("Discovered models:");
                    for a in adapters {
                        let status = if a.loaded { "loaded" } else { "unloaded" };
                        println!("  - {} ({}) [{}]", a.name, a.backend, status);
                    }
                }
            }
                ModelCommands::Run { prompt } => {
                    use hydra_runtime::{GenerationRequest, Modality, ResourceBudget};
                    let mut manager = ModelManager::new();
                    let adapters = manager.discover(&cfg.model_dir);
                    if adapters.is_empty() {
                        let fallback = select_model(hw.available_ram_mb.max(hw.total_ram_mb));
                        println!("No local models found. Using fallback: {}", fallback.name);
                        let req = GenerationRequest {
                            prompt: prompt.clone(),
                            modality: Modality::Text,
                            context_tokens: 0,
                            resource_budget: ResourceBudget { max_ram_mb: hw.available_ram_mb.max(hw.total_ram_mb), max_cpu_percent: 80, timeout_seconds: 60 },
                        };
                        println!("{:?}", fallback.infer(&req));
                    } else if let Some(adapter) = adapters.into_iter().next() {
                        let mut owned = adapter.clone();
                        if let Err(e) = owned.load() {
                            println!("Failed to load model: {e}");
                            return;
                        }
                        println!("Running model: {}", owned.name);
                        let req = GenerationRequest {
                            prompt: prompt.clone(),
                            modality: owned.modality(),
                            context_tokens: 0,
                            resource_budget: ResourceBudget { max_ram_mb: hw.available_ram_mb.max(hw.total_ram_mb), max_cpu_percent: 80, timeout_seconds: 60 },
                        };
                        println!("{:?}", owned.infer(&req));
                    }
                }
        },
        Commands::Creative { command } => match command {
            CreativeCommands::Run { goal } => {
                use hydra_runtime::ResourceBudget;
                let manager = ModelManager::new();
                let budget = ResourceBudget { max_ram_mb: hw.available_ram_mb.max(hw.total_ram_mb), max_cpu_percent: 80, timeout_seconds: 60 };
                let pipeline = CreativePipeline::new(manager, budget);
                let result = pipeline.run(&goal);
                println!("Goal: {}", result.goal);
                println!("Summary:\n{}", result.summary);
                if result.artifacts.is_empty() {
                    println!("No artifacts generated (models may be missing).");
                } else {
                    println!("Artifacts:");
                    for art in result.artifacts {
                        println!("  - {}: {}", art.modality, art.path);
                    }
                }
            }
        },
        Commands::Agent { command } => match command {
            AgentCommands::List => {
                let registry = HeadRegistry::new();
                let agents = registry.list().await;
                if agents.is_empty() {
                    println!("No agents registered.");
                } else {
                    println!("Registered agents:");
                    for spec in agents {
                        println!("  - {} ({})", spec.id, spec.agent_type.as_str());
                    }
                }
            }
        },
        Commands::Skill { command } => match command {
            SkillCommands::List => {
                let registry = SkillRegistry::new();
                let skills = registry.list().await;
                if skills.is_empty() {
                    println!("No skills registered.");
                } else {
                    println!("Registered skills:");
                    for skill in skills {
                        println!("  - {}: {}", skill.id, skill.description);
                    }
                }
            }
        },
        Commands::Benchmark { command } => match command {
            BenchmarkCommands::Run => {
                let scheduler = Scheduler::new(cfg.max_concurrency);
                let job = Job::new("bench-1", "benchmark-run");
                let id = scheduler.enqueue(job).await;
                println!("Benchmark job enqueued: {id}");
            }
        },
        Commands::Grpc { command } => match command {
            GrpcCommands::RunGoal { goal, addr } => {
                match HydraDaemonClient::connect(addr.clone()).await {
                    Ok(mut client) => {
                        let request = tonic::Request::new(TaskCreated {
                            task_id: String::new(),
                            goal,
                        });
                        match client.run_goal(request).await {
                            Ok(response) => {
                                println!("Task started: {}", response.into_inner().task_id);
                            }
                            Err(e) => {
                                eprintln!("gRPC RunGoal failed: {e}");
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to connect to daemon at {addr}: {e}");
                    }
                }
            }
            GrpcCommands::StreamEvents { addr } => {
                match HydraDaemonClient::connect(addr.clone()).await {
                    Ok(mut client) => {
                        let outbound = async_stream::stream! {
                            for i in 0..10u32 {
                                yield Event {
                                    event: Some(hydra_daemon::proto::event::Event::ToolStarted(
                                        hydra_daemon::proto::ToolStarted {
                                            task_id: format!("cli-{}", i),
                                            tool: "cli-stream".into(),
                                        }
                                    ))
                                };
                            }
                        };
                        match client.stream_events(tonic::Request::new(outbound)).await {
                            Ok(response) => {
                                let mut stream = response.into_inner();
                                while let Some(event) = stream.message().await.unwrap_or(None) {
                                    println!("Received event: {:?}", event);
                                }
                            }
                            Err(e) => {
                                eprintln!("gRPC StreamEvents failed: {e}");
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to connect to daemon at {addr}: {e}");
                    }
                }
            }
        },
        Commands::SecurityScan => {
            let kernel = SecurityKernel::new();
            let status = if kernel.kill_switch.is_active() { "active" } else { "inactive" };
            println!("Security scan complete. Kill switch: {status}");
        }
        Commands::EvolutionStatus => {
            let lab = EvolutionLab::new();
            println!("Evolution status:");
            println!("  generations: {}", lab.generations.len());
            println!("  best_fitness: {}", lab.best_fitness);
        }
        Commands::EmergencyStop => {
            let mut kernel = SecurityKernel::new();
            kernel.kill_switch.trigger();
            println!("Emergency stop triggered. Kill switch deactivated.");
        }
    }
}

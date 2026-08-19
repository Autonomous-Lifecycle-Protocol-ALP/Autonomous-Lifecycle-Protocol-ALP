use hydra_daemon::HydraDaemon;
use hydra_core::config::ConfigLoader;
use tokio::signal;

#[tokio::main]
async fn main() {
    let config_path = std::path::PathBuf::from("./config/default.toml");
    let config = ConfigLoader::load_or_default(config_path);
    let daemon = HydraDaemon::new(config.clone()).await;

    daemon.start().await;
    println!("HYDRA daemon started");

    let http_addr = std::net::SocketAddr::new(
        std::net::Ipv4Addr::new(0, 0, 0, 0).into(),
        4020,
    );
    let grpc_addr = std::net::SocketAddr::new(
        std::net::Ipv4Addr::new(0, 0, 0, 0).into(),
        50051,
    );

    let daemon_clone = daemon.clone();
    let http_handle = tokio::spawn(async move {
        if let Err(err) = daemon_clone.serve(http_addr).await {
            eprintln!("HTTP server error: {err}");
        }
    });

    let daemon_clone = daemon.clone();
    let grpc_handle = tokio::spawn(async move {
        if let Err(err) = daemon_clone.serve_grpc(grpc_addr).await {
            eprintln!("gRPC server error: {err}");
        }
    });

    signal::ctrl_c().await.ok();
    println!("Received Ctrl+C, shutting down...");
    daemon.stop().await;

    let _ = http_handle.await;
    let _ = grpc_handle.await;
    println!("HYDRA daemon stopped.");
}

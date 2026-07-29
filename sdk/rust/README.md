# alp-sdk

Official Rust SDK for the Autonomous Lifecycle Protocol (ALP).

## Requirements

- Rust 1.70+
- Cargo

## Installation

```toml
[dependencies]
alp-sdk = "0.45"
```

## Usage

```rust
use alp_sdk::{AlpObject, AlpParser, AlpWorkspace, AlpGraph};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut workspace = AlpWorkspace::new();
    workspace.load("./my-project")?;

    let objects = workspace.objects();
    let graph = workspace.graph();
    let order = workspace.execution_order();

    if let Some(found) = workspace.find_by_id("my-object-id") {
        println!("Found: {}", found.id);
    }

    Ok(())
}
```

## Status

Stable.

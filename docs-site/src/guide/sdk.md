# ALP SDKs

Official SDK packages for integrating ALP (Autonomous Lifecycle Protocol) into multi-language applications and autonomous agent systems.

## Available SDK Matrix

| Language | Package | Version | Primary Capabilities |
|---|---|:---:|---|
| **TypeScript** | `@autonomous-lifecycle-protocol-alp/sdk` | `80.0.0` | Parsing, AST validation, DAG topological graph, Event Mesh, Collaboration |
| **Python** | `alp-sdk` | `80.0.0` | Parsing, verification gates, analytics, DID identity, registry client, P2P swarm |
| **Go** | `alp-go` | `0.46.0` | High-performance DAG resolution, pub/sub event mesh, governance voting, telemetry |
| **Rust** | `alp-rs` | `0.46.0` | Async Tokio-native execution engine, W3C DID identity, cryptographic vault, policy |
| **Java** | `alp-java` | `46.0.0` | Enterprise JVM integration, Jackson object mapping, thread-safe governance & event mesh |

---

## Go (`alp-go`)

### Installation

```bash
go get github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/sdk/go
```

### Usage Example

```go
package main

import (
	"fmt"
	"log"

	alp "github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/sdk/go"
)

func main() {
	// Initialize workspace and parse .alp definitions
	ws := alp.NewWorkspace()
	if err := ws.Load("./my-project"); err != nil {
		log.Fatalf("Failed to load workspace: %v", err)
	}

	// Compute DAG and resolve task ordering
	graph := ws.GetGraph()
	order, err := graph.TopologicalSort()
	if err != nil {
		log.Fatalf("Cycle detected in workspace DAG: %v", err)
	}

	fmt.Printf("Execution order: %v\n", order)

	// Publish telemetry span over Event Mesh
	mesh := alp.NewEventMeshEngine(alp.MeshConfig{Topic: "telemetry.task"})
	mesh.Publish("task.started", map[string]interface{}{
		"taskId": "task-auth",
		"status": "in_progress",
	})
}
```

---

## Rust (`alp-rs`)

### Cargo Dependency

Add to your `Cargo.toml`:

```toml
[dependencies]
alp-rs = "0.46.0"
tokio = { version = "1.0", features = ["full"] }
```

### Usage Example

```rust
use alp_rs::{AlpWorkspace, GovernanceEngine, PolicyEngine, VoteValue};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std.error::Error>> {
    // Load and validate workspace
    let mut ws = AlpWorkspace::new();
    ws.load("./my-project").await?;

    println!("Loaded workspace version: {}", ws.version());

    // Evaluate governance policies
    let policy = PolicyEngine::new();
    let is_allowed = policy.evaluate_action("agent-coder", "write", ".alp/tasks.alp");
    
    if is_allowed {
        println!("Action permitted by @policy engine");
    }

    // Cast governance vote
    let mut gov = GovernanceEngine::new();
    gov.cast_vote("ballot-01", "agent-beta", VoteValue::Approve)?;

    Ok(())
}
```

---

## Java (`alp-java`)

### Maven Dependency

Add to your `pom.xml`:

```xml
<dependency>
    <groupId>com.autonomouslifecycleprotocol</groupId>
    <artifactId>alp-java</artifactId>
    <version>46.0.0</version>
</dependency>
```

### Usage Example

```java
import com.alp.sdk.AlpWorkspace;
import com.alp.sdk.GovernanceEngine;
import com.alp.sdk.EventMeshEngine;
import com.alp.sdk.PolicyEngine;
import com.alp.sdk.MeshEvent;

public class Main {
    public static void main(String[] args) {
        // Load ALP workspace
        AlpWorkspace ws = new AlpWorkspace();
        ws.load("./my-project");

        System.out.println("ALP Java SDK initialized, version: " + ws.getVersion());

        // Initialize Event Mesh Engine
        EventMeshEngine mesh = new EventMeshEngine();
        mesh.subscribe("telemetry.logs", event -> {
            System.out.println("Received telemetry event: " + event.getPayload());
        });

        // Evaluate policy decision
        PolicyEngine policy = new PolicyEngine();
        boolean allowed = policy.checkPermission("agent-1", "deploy", "production");
        System.out.println("Permission check: " + allowed);
    }
}
```

---

## TypeScript (`@autonomous-lifecycle-protocol-alp/sdk`)

```ts
import { AlpWorkspace, MacroEngine, CollaborationEngine } from '@autonomous-lifecycle-protocol-alp/sdk';

const ws = new AlpWorkspace();
ws.load('./my-project');
console.log(ws.getGraph());
```

---

## Python (`alp-sdk`)

```python
from alp_sdk import load_workspace, validate_object, verify_workspace, RegistryClient

# Parse + validate a workspace
objects = load_workspace("./my-project")
for obj in objects:
    validate_object(obj._type, obj.properties)

# Run every task's quality gates
report = verify_workspace("./my-project")
print(report["passed"], [(t["id"], t["verified"]) for t in report["tasks"]])
```

### V12–V46 Module Capabilities

```python
from alp_sdk.cost_optimizer import CostEstimator, CostOptimizer
from alp_sdk.predictive_policy import PredictivePolicyEngine
from alp_sdk.healing import HealingEngine, CircuitBreaker
from alp_sdk.resilience import ResilientSwarm, QuorumConsensus
from alp_sdk.identity import AgentIdentity, VerifiablePresentation
from alp_sdk.p2p import P2PSwarm, GossipProtocol
from alp_sdk.governance import PolicyBallot, GovernanceEngine
from alp_sdk.event_mesh import EventMeshEngine
from alp_sdk.swarm_marketplace import SwarmMarketplaceEngine
```

---

## SDK Features Summary

- **AST Parsing & Validation**: Load `.alp` files into typed objects with JSON Schema enforcement.
- **Topological DAG Resolution**: Compute execution order and detect circular dependencies.
- **Pub/Sub Event Mesh**: Asynchronous streaming for multi-agent event distribution.
- **Swarm Governance**: Voting ballots, quorum validation, and cryptographic identity.
- **Encrypted Vault & Policy**: Least-privilege policy evaluation and secret sealing.


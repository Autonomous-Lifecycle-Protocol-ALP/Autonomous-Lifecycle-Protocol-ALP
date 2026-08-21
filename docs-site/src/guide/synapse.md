# 🧠 Synapse Knowledge Graph & Canvas Vault

**Autonomous Lifecycle Protocol (ALP) v80.0.0** introduces **Synapse** — an interconnected knowledge graph and visual canvas vault engine.

Synapse bridges machine-executable agent lifecycles with human-navigable knowledge systems. It transforms tasks, policies, behavioral contracts, security vaults, and agent swarms into:
1. **Bi-directional Linked Markdown Notes** with standard YAML frontmatter and `[[wikilinks]]`.
2. **Interactive Visual JSON Canvas (`.canvas`)** diagrams natively viewable in Obsidian Canvas, VS Code Canvas, and SHAM IDE.
3. **Map of Content (`MOC.md`)** index summarizing topology hubs, execution status, and dependencies.
4. **Graph Centrality & Bottleneck Analytics** for automated agent swarm optimization.

---

## 🌟 Key Capabilities

| Feature | Description |
| :--- | :--- |
| **Bi-directional Wikilinks** | Automatic `[[task-id]]`, `[[agent-id]]`, and `[[policy-id]]` cross-linking across all generated notes. |
| **JSON Canvas Spec 1.0** | Standards-compliant `.canvas` diagram generation with color-coded nodes, groups, and labeled edges. |
| **Topological Analytics** | Degree centrality, graph density, central hub rankings, orphan node alerts, and broken link detection. |
| **Multi-Format Export** | Export directly to JSON, Mermaid diagrams, Graphviz DOT, and Obsidian vaults. |
| **Native SHAM IDE Panel** | Visual interactive force-directed graph explorer embedded in the SHAM desktop IDE. |

---

## 💻 CLI Commands

The ALP CLI provides native `alp synapse` subcommands:

### 1. Export Workspace as Markdown Vault & Canvas
Export all `.alp` files in the current workspace to an Obsidian/Canvas-compatible vault:

```bash
# Export to default '.synapse' directory with .canvas diagram
alp synapse export --canvas

# Export to custom directory
alp synapse export --out ./vault --canvas
```

**Output Structure:**
```
.synapse/
├── MOC.md                    # Master Map of Content index
├── synapse.canvas            # Interactive visual canvas diagram
├── tasks/
│   ├── task-auth.md
│   └── task-db-schema.md
├── agents/
│   └── agent-security.md
├── policies/
│   └── policy-zero-trust.md
└── contracts/
    └── contract-jwt.md
```

### 2. Inspect Graph Topology Statistics
Analyze connectivity metrics, degree centrality, and bottleneck nodes:

```bash
alp synapse stats
```

**Example Output:**
```
═══════════════════════════════════════════════════════════
🧠 ALP SYNAPSE KNOWLEDGE GRAPH STATS (v80.0.0)
═══════════════════════════════════════════════════════════
  • Total Nodes:      12
  • Total Edges:      16
  • Graph Density:    0.1212
  • Central Hubs:
      - task-pq-handshake (Degree: 5)
      - agent-cryptographer (Degree: 4)
  • Object Breakdown:
      - task: 4
      - agent: 4
      - policy: 2
      - contract: 2
  • Broken Links:     0
  • Orphan Nodes:     0
```

### 3. Generate Graph Representations
Output graph topologies formatted for external renderers or pipelines:

```bash
# Generate Mermaid diagram
alp synapse graph --format mermaid

# Generate Graphviz DOT file
alp synapse graph --format dot --out graph.dot

# Output raw JSON topology
alp synapse graph --format json
```

---

## 🛠️ TypeScript SDK Usage

The `@autonomous-lifecycle-protocol-alp/sdk` package exports the `SynapseEngine` for programmatic topology compilation:

```typescript
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

// 1. Parse ALP objects
const parser = new AlpParser();
const objects = parser.parse(alpSpecString);

// 2. Instantiate Synapse Engine
const engine = new SynapseEngine();

// 3. Build topology and compute graph metrics
const topology = engine.buildTopology(objects);
console.log(`Density: ${topology.stats.density}`);
console.log(`Hubs:`, topology.stats.centralHubs);

// 4. Generate Vault Markdown files + MOC
const vaultFiles = engine.generateVault(objects);
for (const file of vaultFiles) {
  console.log(`File: ${file.relativePath}`);
}

// 5. Generate JSON Canvas data
const canvas = engine.generateCanvas(topology);
```

---

## 🎨 SHAM Desktop IDE Integration

Inside the **SHAM IDE**, click the **Synapse** icon in the sidebar or press `Ctrl+Shift+K` to open the visual knowledge graph:

- **Force-Directed Graph**: Click nodes to inspect incoming backlinks and outgoing dependencies.
- **Filter by Type**: Isolate tasks, agents, policies, or contracts.
- **1-Click Vault Export**: Download Markdown vaults and `.canvas` files instantly.
- **Live Diagnostics**: Real-time broken link and orphan node warning indicators.

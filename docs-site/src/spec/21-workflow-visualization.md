# ALP Specification — Workflow Visualization

**Version:** 80.0.0  
**Status:** Stable  

---

## 1. Workflow Visualization Overview

```mermaid
flowchart LR
    Workflow[@workflow] --> Steps[Steps]
    Steps --> Step1[Step 1]
    Steps --> Step2[Step 2]
    Steps --> Step3[Step 3]
    Step1 -->|on_success| Step2
    Step2 -->|on_failure| Step1
    Engine[Visualizer] --> Mermaid[Mermaid]
    Engine --> DOT[Graphviz DOT]
    Engine --> JSON[JSON]
```

## 2. Overview

ALP v10.2.0 introduces **Workflow Visualization**: the ability to render
`@workflow` objects as diagrams. Because ALP workflows are machine-readable
directed graphs of steps, agents, and conditions, they can be transformed into
standard diagram formats without any external model.

This enables:

- **Human review** of complex multi-agent workflows
- **Documentation** generated directly from `.alp` files
- **CI artifacts** (PNG/SVG) published as part of a build
- **AI-assisted planning**: an LLM can read the Mermaid/DOT output to reason
  about execution order

---

## 2. Diagram Formats

### 2.1 Mermaid `flowchart`

Mermaid is the default format. It produces a `flowchart TD` (top-down) graph
with one `subgraph` per workflow.

```mermaid
flowchart TD
  subgraph wf_standard["Standard Development"]
    s_wf_0[Step A]
    s_wf_1{{Step B\ngroup: impl}}
    s_wf_2{{Step C\ngroup: impl}}
    s_wf_3[Step D]
    grp_impl --> s_wf_3
    s_wf_0 --> s_wf_1
    s_wf_1 --> s_wf_2
    s_wf_2 --> s_wf_3
    s_wf_3 --> wf_standard_done(["Done"])
  end
```

### 2.2 CLI Usage

```bash
# Output Mermaid diagram for a workflow
alp visualize wf-standard --format mermaid --out workflow.mmd
```

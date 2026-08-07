---
title: ALP Hybrid Engineer AI
---

# ALP Hybrid Engineer AI

Physical + software engineering agent for firmware, CAD, FEA, PCB layout, CNC tooling, and IoT — fully ALP-native with digital twin sync.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $199 / mo | Firmware, CAD, PCB, IoT personas |
| Enterprise | Custom | Digital twin sync, safety-critical rules, SLA |

## Feature Deep-Dive

### Firmware Generation
Generate STM32, ESP32, and Arduino firmware from `.alp` hardware task specs. Output includes buildable C/Rust code, linker scripts, and BOM manifests.

### CAD Design & BOM Extraction
Read and write STEP, STL, and DXF files. Extract bills of materials from CAD assemblies and sync with procurement workflows.

### FEA / CFD Simulation
Run structural and fluid simulations as ALP tasks. Results are recorded in the timeline and compared against safety thresholds defined in `@policy`.

### PCB Layout & DFM
Auto-route PCBs or generate manufacturing-ready Gerbers. DFM checks flag clearance, trace width, and assembly issues before fabrication.

### IoT Telemetry & Anomaly Detection
Connect physical sensors via MQTT or OPC-UA. ALP agents detect anomalies using time-series models and can trigger maintenance `@task` blocks.

### Digital Twin Sync
Keep a live software replica of physical assets. Twin state is versioned in the ALP vault and can be rewound to any point in time for forensics.

## Use Cases

- **Hardware startups** prototyping firmware and PCBs without dedicated electrical engineers.
- **Manufacturing teams** monitoring production lines with IoT telemetry and anomaly detection.
- **Defense/aerospace** teams needing safety-critical validation and immutable audit trails.

## Integration

Creates `@task`/`@workflow` for hardware validation, `@policy` for safety-critical rules, and `@timeline` for maintenance scheduling.

## Quickstart

1. Install the persona pack: `npm install -g @alp/hybrid-engineer@80.0.0`
2. Enable in your project: `alp persona add hybrid-engineer`
3. Define a hardware task: `@task firmware(board: esp32, peripherals: [sensor, relay])`
4. Run simulation: `alp run --task firmware --simulate`
5. Sync to digital twin: `alp twin sync --device line-3-press`

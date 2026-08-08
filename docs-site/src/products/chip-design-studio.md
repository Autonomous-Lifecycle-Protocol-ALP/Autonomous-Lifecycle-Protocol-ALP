---
title: ALP Chip Design Studio
---

# ALP Chip Design Studio

ASIC/FPGA design from RTL to tape-out with synthesis, place & route, timing closure, and formal verification.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $499 / mo | RTL design, synthesis, P&R, timing |
| Enterprise | Custom | Formal verification, tape-out, vendor EDA sync |

## Feature Deep-Dive

### RTL Design
Write SystemVerilog or VHDL inside `.alp` `@task` blocks. ALP provides syntax highlighting, linting, and auto-completion via the VS Code extension.

### Synthesis
Run Yosys or Cadence Genus synthesis as ALP tasks. Reports are parsed and stored in the timeline. Area, timing, and power estimates are surfaced in the dashboard.

### Place & Route
Execute OpenROAD or Innovus P&R flows. ALP monitors DRC violations and can iterate placement automatically to meet timing constraints.

### Timing Analysis
Static timing analysis (STA) with PrimeTime or OpenSTA. Setup, hold, and pulse-width violations are mapped back to RTL source lines.

### FPGA Flow
Support for Xilinx Vivado and nextpnr. Bitstream generation and hardware-in-the-loop testing are orchestrated as ALP tasks.

### Formal Verification
Property checking and equivalence verification. ALP generates cover properties from `@contract` interface specifications and reports counterexamples.

## Use Cases

- **ASIC teams** automating RTL-to-GDSII flows with ALP orchestration.
- **FPGA teams** iterating on firmware with fast P&R and hardware validation.
- **EDA teams** integrating proprietary tools into a unified ALP pipeline.

## Integration

Creates `@task` for RTL blocks, `@workflow` for synthesis→P&R→STA pipeline, `@policy` for DRC rules, and `@contract` for interface compliance.

## Quickstart

1. Install the EDA plugin: `npm install -g @alp/chip-design-studio@80.0.0`
2. Initialize a chip project: `alp init chip-project --template asic`
3. Write RTL: `@task rtl(module: alu, inputs: [a, b, op], outputs: [result])`
4. Run synthesis: `alp run --workflow synthesize`
5. Generate timing report: `alp analytics timing --stage sta`

# Data Pipeline Example

This project demonstrates how the Autonomous Lifecycle Protocol (ALP) can orchestrate complex, multi-agent data processing workflows.

## Features
- **Workflow Orchestration**: Orchestrates three distinct agents (Extractor, Cleaner, Analyst) using sequential dependencies.
- **Governance & Safety**: Demonstrates how `.alp/governance.alp` blocks execution or flags violations if the `agent-cleaner` fails to remove PII.
- **Cron Triggers**: Shows how workflows can be scheduled automatically.

## Usage
Run the mock python script to see the ALP orchestration in action:
```bash
python3 src/pipeline.py
```

---
title: ALP Analytics & BI
---

# ALP Analytics & BI

Business intelligence dashboards for team productivity, cost tracking, agent performance analytics, and predictive resource planning.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $79 / mo | Productivity dashboards, cost tracking, 5 users |
| Enterprise | $499 / mo | Predictive planning, BI export, SSO, unlimited users |

## Feature Deep-Dive

### Productivity Metrics
Track task throughput, cycle time, and WIP per team and per agent persona. Compare human-only, agent-assisted, and fully autonomous workflows.

### Cost Tracking & Optimization
Monitor token spend, API costs, and compute usage per task and per agent. Recommendations surface cheaper models or redundant swarms.

### Agent Performance
Latency histograms, error budgets, and success rates for every agent. Drill into individual task executions via the ALP timeline.

### Predictive Planning
Forecast sprint capacity based on historical task complexity. ALP predicts which tasks will exceed time or budget limits before they run.

### BI Tool Export
Push ALP metrics to Metabase, Grafana, Looker, or Power BI via native connectors or a REST analytics API.

## Use Cases

- **Engineering managers** who need visibility into team and agent productivity.
- **Finance teams** that track AI spend and need chargeback reports.
- **Platform teams** optimizing model routing and swarm sizing.

## Integration

Reads from the ALP Event Mesh and `@analytics` blocks. Integrates with `@swarm_marketplace` for cost metering and `@timeline` for historical replay.

## Quickstart

1. Enable analytics in your project: `alp analytics enable`
2. Connect a BI tool: `alp analytics connect --provider grafana`
3. View dashboards in the Enterprise Dashboard under Analytics.
4. Export cost reports: `alp analytics costs --month 2026-07 --format csv`

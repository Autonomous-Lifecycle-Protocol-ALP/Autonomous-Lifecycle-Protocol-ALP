---
title: ALP Cloud Workspace
---

# ALP Cloud Workspace

Hosted, managed ALP development environments with real-time collaboration, built-in CI/CD, and integrated deployment to cloud providers.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $49 / dev / mo | Shared workspaces, CI/CD, RBAC |
| Enterprise | $999 / org / mo | Private clusters, SSO, audit logs, SLA |

## Feature Deep-Dive

### Pre-Configured Environments
Spin up isolated ALP workspaces with the parser, SDK, and event mesh pre-installed. Supports Node, Python, Go, Rust, and Java runtimes out of the box.

### Real-Time Collaboration
Multiple engineers edit the same `.alp` project simultaneously. Changes merge via ALP's event-sourced timeline with conflict-free resolution.

### Built-In CI/CD
Every `alp run` and `alp verify` can trigger GitHub Actions, GitLab CI, or CircleCI pipelines. Quality gates enforce `@contract` and `@policy` before merge.

### Multi-Cloud Deployment
One-click deploy to AWS, Azure, GCP, or DigitalOcean. ALP manages infrastructure drift detection via `@timeline` snapshots.

### RBAC & Snapshots
Role-based access control for workspaces. Automated snapshots enable instant rollback when a task swarm diverges from expected behavior.

## Use Cases

- **Remote teams** need a consistent ALP runtime without local setup.
- **Enterprise orgs** require SSO, audit trails, and private cloud deployment.
- **CI/CD teams** want native ALP pipeline integration with quality gates.

## Integration

Extends `@workflow`, `@timeline`, and `@contract` for managed execution. The Cloud Workspace controller runs as a long-lived ALP task that provisions infrastructure on demand.

## Quickstart

1. Sign up at [alp.cloud](https://alp.cloud) and create a workspace.
2. Install the CLI: `npm install -g @alp/cli@80.0.0`
3. Authenticate: `alp login --cloud`
4. Initialize a project: `alp init my-project --cloud`
5. Run your first swarm: `alp run`

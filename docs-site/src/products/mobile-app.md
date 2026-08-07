---
title: ALP Mobile App
---

# ALP Mobile App

iOS and Android companion for reviewing agent decisions, approving HITL checkpoints, and monitoring swarm activity with push notifications.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | Read-only event feed, basic notifications |
| Pro | $4.99 / mo | HITL approvals, push alerts, offline mode |

## Feature Deep-Dive

### HITL Checkpoint Approval
Human-in-the-loop decisions are routed to your phone. Approve, reject, or modify agent proposals with a single tap. Decisions are signed and recorded in the ALP timeline.

### Push Notifications
Real-time alerts for swarm failures, policy violations, and cost-budget warnings. Notification rules are configured via `@policy` blocks in your `.alp` project.

### Swarm Activity Feed
Scrollable event stream showing agent spawns, task completions, and memory writes. Filter by agent ID, project, or severity.

### Agent Performance Dashboard
Compact dashboards for throughput, error rate, and token cost per agent. Compare agent personas side-by-side.

### Offline Mode
Queue HITL decisions offline; they sync when connectivity returns. Conflict resolution uses ALP's CRDT-based event merge.

## Use Cases

- **Field engineers** approve robot or drone swarm actions from a mobile terminal.
- **Security teams** triage SOC alerts during on-call rotations.
- **Managers** track project progress without pulling out a laptop.

## Integration

WebSocket API to the ALP Event Mesh. The mobile app authenticates via SPIFFE/SPIRE workload identity and consumes the same event stream as the desktop IDE.

## Quickstart

1. Download from the App Store or Google Play.
2. Scan the QR code from `alp dashboard --qr`.
3. Grant notification permissions.
4. Select a project and enable HITL mode.

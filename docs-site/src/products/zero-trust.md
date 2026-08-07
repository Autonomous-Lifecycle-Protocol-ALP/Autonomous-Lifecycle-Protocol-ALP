---
title: ALP Zero Trust Orchestrator
---

# ALP Zero Trust Orchestrator

Zero-trust network security for agent swarms with SPIFFE/SPIRE identities, mutual TLS, micro-segmentation, and continuous re-authentication.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $399 / mo | SPIFFE/SPIRE, mTLS, micro-segmentation, 50 agents |
| Enterprise | Custom | OPA policies, W3C Verifiable Credentials, unlimited agents |

## Feature Deep-Dive

### SPIFFE/SPIRE Agent Identities
Every agent, task, and service receives a short-lived SPIFFE ID. Identities are minted at runtime and rotated automatically without downtime.

### Mutual TLS Everywhere
ALP components communicate over mTLS. Certificate provisioning and rotation are managed by SPIRE with zero-touch enrollment for new agents.

### Micro-Segmentation via @contract
Network policies are derived from ALP `@contract` boundaries. Unauthorized communications are blocked at the kernel level using eBPF or Istio sidecars.

### Continuous Authentication
Agents re-authenticate every 15 minutes. Sessions are invalidated on policy change or behavioral anomaly detected by `@analytics`.

### OPA Policy Engine Integration
Authorization policies are written in Rego and evaluated by Open Policy Agent. Policies consume ALP timeline events for real-time decisions.

### Audit Trail with W3C Verifiable Credentials
Every authentication, policy decision, and certificate issuance is recorded as a W3C Verifiable Credential. Auditors can verify the complete chain of trust.

## Use Cases

- **Enterprise security teams** enforcing zero-trust for AI agent infrastructure.
- **Regulated industries** requiring immutable identity and access audit trails.
- **Platform teams** building secure multi-tenant ALP deployments.

## Integration

Enforces `@contract` as network policy, integrates `@policy` for authorization, `@vault` for certificate management, `@timeline` for audit logs, and `@analytics` for trust metrics.

## Quickstart

1. Install the orchestrator: `npm install -g @alp/zero-trust@80.0.0`
2. Enable in your project: `alp plugin add zero-trust`
3. Initialize SPIRE: `alp zta spire init --bundle <spire-server-url>`
4. Apply micro-segmentation: `alp zta segment --policy ./network-policy.alp`
5. Verify trust: `alp zta status --agent swarm-main`

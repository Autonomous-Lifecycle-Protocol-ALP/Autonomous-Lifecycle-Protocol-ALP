---
title: ALP Security Scanner
---

# ALP Security Scanner

Automated security and compliance scanning that runs as a verification gate in ALP task pipelines.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $149 / mo | SAST/DAST, dependency checks, 5 projects |
| Enterprise | $2,499 / mo | Policy-as-code, SOC2/ISO27001/GDPR/HIPAA, unlimited projects |

## Feature Deep-Dive

### SAST/DAST Scanning
Static analysis of `.alp` files, agent code, and generated artifacts. Dynamic scanning tests running swarms against OWASP Top 10 and ALP-specific adversarial patterns.

### Vulnerability Detection
Dependency scanning for npm, PyPI, Maven, Cargo, and Go modules. CVE lookups via OSV and Snyk. Prioritization by CVSS score and exploit availability.

### Policy-as-Code
Write security rules in `.alp` `@policy` blocks. Rules run in every CI build and can block merges, quarantine swarms, or trigger incident response playbooks.

### Compliance Reporting
Auto-generated SOC2, ISO27001, GDPR, and HIPAA reports. Evidence is pulled directly from the ALP timeline and vault audit logs.

### Remediation Suggestions
Each finding includes a suggested patch or policy override. One-click PRs can be opened directly from the Security Scanner dashboard.

## Use Cases

- **Enterprise engineering** teams that need compliance evidence for audits.
- **Security teams** that want automated vulnerability management without manual triage.
- **DevOps teams** that need security gates in CI/CD without slowing releases.

## Integration

Adds verification steps to `@task verify` blocks. Integrates with `@contract` to enforce security boundaries and with `@timeline` for immutable audit trails.

## Quickstart

1. Install the scanner plugin: `npm install -g @alp/security-scanner@80.0.0`
2. Add to your ALP project: `alp plugin add security-scanner`
3. Run a local scan: `alp scan --target . --policy security/`
4. View results in the Enterprise Dashboard or export JSON/SARIF.

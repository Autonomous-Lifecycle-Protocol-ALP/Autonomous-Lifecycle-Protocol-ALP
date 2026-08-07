---
title: ALP Threat Intelligence Engine
---

# ALP Threat Intelligence Engine

Proactive vulnerability discovery, adversarial behavior modeling, exploit prediction, and automated remediation task generation.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $199 / mo | Vulnerability scanning, threat hunting, 20 projects |
| Enterprise | Custom | Adversarial ML prediction, feed correlation, SLA |

## Feature Deep-Dive

### Vulnerability Scanning
Run Trivy, Snyk, or Grype against code, containers, and infrastructure-as-code. Results are normalized into ALP findings with CVSS scores and remediation tasks.

### Threat Hunting with IoCs
Hunt for indicators of compromise across agent logs, network flows, and cloud audit trails. IoCs are stored as `@expect` rules and evaluated in real time.

### Adversarial ML Prediction
Model likely attack vectors based on agent capabilities, exposed tools, and historical telemetry. Predictions generate prioritized `@task` remediation items.

### External Threat Feed Correlation
Ingest STIX/TAXII feeds, CVE databases, and vendor advisories. ALP correlates external intel with internal asset inventories to prioritize patching.

### Automated Patching Recommendations
Each vulnerability includes a suggested patch, dependency bump, or policy override. One-click PRs can be opened from the Threat Intelligence dashboard.

### CVSS Risk Scoring
Findings are scored using CVSS v3.1. ALP factors exploitability, asset criticality, and compensating controls to produce a prioritized backlog.

## Use Cases

- **Security teams** automating vulnerability management and patch prioritization.
- **DevSecOps teams** embedding threat intelligence into CI/CD.
- **CISOs** who need executive dashboards for risk posture.

## Integration

Creates `@task` for remediation, feeds `@policy` for adaptive rules, uses `@timeline` for scheduled scans, and consumes `@contract` for attack surface mapping.

## Quickstart

1. Install the engine: `npm install -g @alp/threat-intel@80.0.0`
2. Enable scanning: `alp threat-intel scan --target ./ --scanners trivy,snyk`
3. Review findings: `alp dashboard --plugin threat-intel`
4. Auto-remediate low-risk findings: `alp threat-intel remediate --auto low`
5. Schedule scans: `alp threat-intel schedule --cron "0 0 * * *"`

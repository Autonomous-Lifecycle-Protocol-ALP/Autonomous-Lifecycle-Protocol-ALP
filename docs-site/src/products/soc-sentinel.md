---
title: ALP SOC Sentinel AI
---

# ALP SOC Sentinel AI

Real-time threat detection, automated incident response, and attack surface monitoring for ALP-managed agent swarms and infrastructure.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Pro | $299 / mo | Threat detection, SOC dashboard, 10 agents |
| Enterprise | Custom | Adversarial ML defense, forensics, MITRE ATT&CK mapping |

## Feature Deep-Dive

### Threat Detection via Event Correlation
Correlate events across agent swarms, CI/CD pipelines, and cloud infrastructure. Detect lateral movement, privilege escalation, and data exfiltration in real time.

### Automated Incident Response
Playbooks define automated containment actions: quarantine agents, rotate `@vault` credentials, and spin up forensic sandboxes. Human approval gates prevent destructive automation.

### Adversarial ML Defense
Detect prompt injection, model extraction, and jailbreaking against LLM agents. ALP inspects agent inputs and outputs using trained classifiers.

### Attack Surface Monitoring
Continuously map agent capabilities, exposed tools, and network policies. `@contract` boundaries are monitored for unauthorized access patterns.

### SOC Dashboard & Forensics
Unified dashboard for alerts, timelines, and agent telemetry. Investigate incidents by replaying the ALP timeline in a forensic sandbox.

### MITRE ATT&CK Mapping
Alerts are mapped to MITRE ATT&CK tactics and techniques. SOC teams can filter dashboards by adversary profile and compliance framework.

## Use Cases

- **Security operations centers** monitoring ALP deployments at scale.
- **AI safety teams** defending agent swarms against adversarial inputs.
- **Compliance teams** needing immutable forensics for incident response.

## Integration

Consumes `@analytics` for anomalies, `@policy` for response rules, `@timeline` for forensics, and `@vault` for credential revocation.

## Quickstart

1. Install the SOC plugin: `npm install -g @alp/soc-sentinel@80.0.0`
2. Enable in your project: `alp plugin add soc-sentinel`
3. Configure detection rules: `alp sentinel rules apply --file rules.yml`
4. View dashboard: `alp dashboard --plugin soc-sentinel`
5. Run a tabletop drill: `alp sentinel drill --scenario prompt-injection`

import { SOCSentinelEngine } from '@autonomous-lifecycle-protocol-alp/parser';
import type { ThreatSeverity, RemediationAction } from '@autonomous-lifecycle-protocol-alp/parser';

export interface SentinelCommandOptions {
  severity?: string;
  pattern?: string;
  action?: string;
  auto?: boolean;
}

export function socSentinelCommand(sub: string, args: string[] = [], options: SentinelCommandOptions = {}) {
  const engine = new SOCSentinelEngine();

  // Seed some default rules for demo purposes
  engine.addRule('rule-sqli', 'SQL Injection', 'sql injection', 'CRITICAL', 'ISOLATE_AGENT', 'Detects SQL injection attempts in agent inputs');
  engine.addRule('rule-xss', 'Cross-Site Scripting', 'xss', 'HIGH', 'QUARANTINE_FILE', 'Detects XSS payload patterns');
  engine.addRule('rule-priv-esc', 'Privilege Escalation', 'privilege escalation', 'CRITICAL', 'REVOKE_CREDENTIALS', 'Detects unauthorized privilege escalation attempts');
  engine.addRule('rule-data-exfil', 'Data Exfiltration', 'exfiltration', 'HIGH', 'BLOCK_IP', 'Detects data exfiltration patterns');
  engine.addRule('rule-brute-force', 'Brute Force', 'brute force', 'MEDIUM', 'BLOCK_IP', 'Detects brute force login attempts');
  engine.addRule('rule-unauth', 'Unauthorized Access', 'unauthorized', 'HIGH', 'REVOKE_CREDENTIALS', 'Detects unauthorized access attempts');

  switch (sub) {
    case 'rules': {
      const action = args[0] || 'list';

      if (action === 'add') {
        const ruleId = args[1];
        const name = args[2];
        const pattern = options.pattern || args[3] || '';
        const severity = (options.severity || 'MEDIUM').toUpperCase() as ThreatSeverity;
        const remediation = (options.action || 'NOTIFY_TEAM').toUpperCase() as RemediationAction;

        if (!ruleId || !name) {
          console.error('Usage: alp sentinel rules add <id> <name> --pattern <p> --severity <s>');
          process.exit(1);
        }

        const rule = engine.addRule(ruleId, name, pattern, severity, remediation);
        console.log('\n🛡️  SOC Sentinel — Rule Added');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  Rule ID:    ${rule.ruleId}`);
        console.log(`  Name:       ${rule.name}`);
        console.log(`  Pattern:    ${rule.pattern}`);
        console.log(`  Severity:   ${rule.severity}`);
        console.log(`  Action:     ${rule.action}`);
        console.log(`  Status:     ${rule.enabled ? 'ENABLED' : 'DISABLED'}\n`);
      } else {
        const rules = engine.listRules();
        console.log('\n🛡️  SOC Sentinel — Detection Rules');
        console.log('═══════════════════════════════════════════════════════\n');

        if (rules.length === 0) {
          console.log('  No rules configured.\n');
          return;
        }

        const sevColors: Record<ThreatSeverity, string> = {
          CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢', INFO: '🔵',
        };

        for (const r of rules) {
          console.log(`  ${sevColors[r.severity]} ${r.name} (${r.ruleId})`);
          console.log(`     Pattern: "${r.pattern}" | Severity: ${r.severity}`);
          console.log(`     Action: ${r.action} | Matches: ${r.matchCount} | ${r.enabled ? 'ENABLED' : 'DISABLED'}\n`);
        }
      }
      break;
    }

    case 'scan': {
      const agents = args.length > 0 ? args : ['agent-alpha', 'agent-beta', 'agent-gamma', 'agent-deployer'];
      const surface = engine.scanAttackSurface(agents);

      console.log('\n🔎 SOC Sentinel — Attack Surface Scan');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`  Overall Risk Score: ${surface.riskScore ?? 45}/100\n`);

      console.log('  Identified Vulnerabilities:');
      for (const vuln of (surface.vulnerabilities || [])) {
        console.log(`    • ${vuln}`);
      }
      console.log('');

      for (const entry of surface) {
        const riskBar = '█'.repeat(Math.floor(entry.riskScore / 5)) + '░'.repeat(20 - Math.floor(entry.riskScore / 5));
        const riskLabel = entry.riskScore >= 70 ? '🔴 CRITICAL' : entry.riskScore >= 40 ? '🟠 ELEVATED' : '🟢 LOW';

        console.log(`  🤖 ${entry.agentId}`);
        console.log(`     Endpoints: ${entry.exposedEndpoints} | Open Ports: ${entry.openPorts} | Vulns: ${entry.vulnerabilities}`);
        console.log(`     Risk: [${riskBar}] ${entry.riskScore}/100 ${riskLabel}\n`);
      }
      break;
    }

    case 'alerts': {
      // Ingest some demo events to generate alerts
      engine.ingestEvent({ eventId: 'evt-1', source: 'agent-alpha', type: 'input', payload: 'SELECT * FROM users; -- sql injection attempt', timestamp: new Date().toISOString() });
      engine.ingestEvent({ eventId: 'evt-2', source: 'agent-beta', type: 'request', payload: 'Detected XSS payload <script>alert(1)</script>', timestamp: new Date().toISOString() });
      engine.ingestEvent({ eventId: 'evt-3', source: 'agent-gamma', type: 'auth', payload: 'brute force login attempts detected', timestamp: new Date().toISOString() });

      const severity = options.severity?.toUpperCase() as ThreatSeverity | undefined;
      const alerts = engine.getAlerts(severity);

      console.log('\n🚨 SOC Sentinel — Active Alerts (Threat Alerts)');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`  Open Alerts: ${alerts.length}\n`);

      if (alerts.length === 0) {
        console.log('  No alerts. All clear ✓\n');
        return;
      }

      const sevColors: Record<ThreatSeverity, string> = {
        CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢', INFO: '🔵',
      };

      for (const a of alerts) {
        console.log(`  ${sevColors[a.severity]} [${a.severity}] ${a.ruleName} (${a.alertId})`);
        console.log(`     Source: ${a.source} | Status: ${a.status}`);
        console.log(`     Pattern: "${a.matchedPattern}"`);
        console.log(`     Action: ${a.suggestedAction}`);
        console.log(`     Detected: ${a.detectedAt}\n`);
      }

      console.log(`  Total: ${alerts.length} alert(s)\n`);
      break;
    }

    case 'incident': {
      const alertId = args[0];

      // Generate a demo alert if none provided
      engine.ingestEvent({ eventId: 'evt-demo', source: 'agent-compromised', type: 'exploit', payload: 'privilege escalation attempt detected', timestamp: new Date().toISOString() });

      const alerts = engine.getAlerts();
      const targetAlert = alertId ? (alerts.find(a => a.alertId === alertId) || { alertId, ruleName: 'Escalated Threat', severity: 'HIGH' as ThreatSeverity }) : alerts[0];

      const incident = engine.createIncident(targetAlert.alertId);

      console.log('\n🚨 SOC Sentinel — Incident Created');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`  Incident ID:    ${incident.incidentId}`);
      console.log(`  Title:          ${incident.title}`);
      console.log(`  Severity:       ${incident.severity}`);
      console.log(`  Status:         ${incident.status}`);
      console.log(`  Affected:       ${incident.affectedAgents.join(', ') || 'agent-system'}`);
      console.log(`  MTTD:           ${incident.timeToDetectMs}ms`);
      console.log('\n  📋 Remediation Steps:');
      for (const step of incident.remediationSteps) {
        console.log(`    • [${step.status}] ${step.action} → ${step.target}`);
      }
      console.log('');
      break;
    }

    case 'remediate': {
      const incidentId = args[0] || 'inc-demo';

      // Create a demo incident for remediation
      engine.ingestEvent({ eventId: 'evt-rem', source: 'agent-compromised', type: 'exploit', payload: 'sql injection in production agent', timestamp: new Date().toISOString() });
      const alerts = engine.getAlerts();
      const incident = engine.createIncident(alerts[0]?.alertId || 'alert-1');

      const remediated = engine.autoRemediate(incidentId || incident.incidentId);

      console.log('\n🔧 SOC Sentinel — Remediation');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`  Incident ID:    ${remediated.incidentId}`);
      console.log(`  Status:         ${remediated.status}`);
      console.log(`  Remediated:     YES ✓`);
      console.log(`  MTTD:           ${remediated.timeToDetectMs}ms`);
      console.log(`  MTTR:           ${remediated.timeToRespondMs}ms`);
      console.log('\n  ✅ Remediation Steps:');
      for (const step of remediated.remediationSteps) {
        console.log(`    • [${step.status}] ${step.action}`);
        if (step.result) console.log(`      → ${step.result}`);
      }
      console.log('');
      break;
    }

    case 'dashboard': {
      // Seed data for dashboard
      engine.ingestEvent({ eventId: 'evt-d1', source: 'agent-1', type: 'exploit', payload: 'sql injection attempt', timestamp: new Date().toISOString() });
      engine.ingestEvent({ eventId: 'evt-d2', source: 'agent-2', type: 'attack', payload: 'xss payload detected', timestamp: new Date().toISOString() });
      engine.ingestEvent({ eventId: 'evt-d3', source: 'agent-3', type: 'auth', payload: 'brute force detected', timestamp: new Date().toISOString() });
      engine.ingestEvent({ eventId: 'evt-d4', source: 'agent-1', type: 'access', payload: 'unauthorized access attempt', timestamp: new Date().toISOString() });

      const alert0 = engine.getAlerts()[0];
      if (alert0) {
        const inc = engine.createIncident(alert0.alertId);
        engine.autoRemediate(inc.incidentId);
      }

      const dash = engine.getDashboard();

      console.log('\n🛡️  SOC SENTINEL AI — SECURITY OPERATIONS DASHBOARD');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`  SECURITY POSTURE SCORE:  ${dash.postureScore}/100`);
      console.log(`  Active Detection Rules:  ${dash.activeRulesCount}/${dash.totalRules}`);
      console.log(`  Rules:       ${dash.activeRulesCount}/${dash.totalRules} active`);
      console.log(`  Alerts:      ${dash.openAlerts} open / ${dash.totalAlerts} total (${dash.criticalAlerts} critical)`);
      console.log(`  Incidents:   ${dash.openIncidents} open / ${dash.totalIncidents} total`);
      console.log(`  MTTD:        ${dash.meanTimeToDetectMs}ms`);
      console.log(`  MTTR:        ${dash.meanTimeToRespondMs}ms\n`);
      console.log(`  Overall Risk: [${'█'.repeat(Math.floor(dash.overallRiskScore / 5))}${'░'.repeat(20 - Math.floor(dash.overallRiskScore / 5))}] ${dash.overallRiskScore}/100 🔴 CRITICAL\n`);

      console.log('  🏆 Top Threats:');
      for (const t of dash.topThreats) {
        console.log(`    • ${t.rule}: ${t.count} match(es)`);
      }
      console.log('');
      break;
    }

    default:
      console.error(`Unknown sentinel subcommand: ${sub}`);
      console.error('Available: rules, scan, alerts, incident, remediate, dashboard');
      process.exit(1);
  }
}

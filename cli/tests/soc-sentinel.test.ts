import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'path';
import { SOCSentinelEngine } from '@autonomous-lifecycle-protocol-alp/parser';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('ALP SOC Sentinel AI', () => {
  describe('SOCSentinelEngine', () => {
    it('manages threat detection rules', () => {
      const engine = new SOCSentinelEngine();
      const rule = engine.addRule(
        'rule-rce',
        'Remote Code Execution',
        'exec\\(|eval\\(',
        'CRITICAL',
        'ISOLATE_AGENT',
        'Detects code execution primitives in input stream'
      );

      expect(rule.ruleId).toBe('rule-rce');
      expect(rule.severity).toBe('CRITICAL');
      expect(rule.enabled).toBe(true);

      const rules = engine.listRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(engine.getRule('rule-rce')).toBeDefined();
    });

    it('ingests security events and triggers alerts based on pattern matching', () => {
      const engine = new SOCSentinelEngine();
      engine.addRule('rule-sql', 'SQL Injection', 'UNION SELECT', 'CRITICAL', 'BLOCK_IP');

      const alert = engine.ingestEvent({
        sourceAgent: 'agent-gateway',
        targetAgent: 'agent-db',
        action: 'QUERY',
        payload: "SELECT * FROM users WHERE id = 1 UNION SELECT password FROM admin",
      });

      expect(alert).not.toBeNull();
      expect(alert?.ruleId).toBe('rule-sql');
      expect(alert?.severity).toBe('CRITICAL');
      expect(alert?.status).toBe('OPEN');

      const allAlerts = engine.getAlerts();
      expect(allAlerts.length).toBe(1);
    });

    it('filters alerts by severity level', () => {
      const engine = new SOCSentinelEngine();
      engine.addRule('r-crit', 'Crit Rule', 'malware', 'CRITICAL', 'ISOLATE_AGENT');
      engine.addRule('r-med', 'Med Rule', 'port-scan', 'MEDIUM', 'NOTIFY_TEAM');

      engine.ingestEvent({ sourceAgent: 'a1', action: 'RUN', payload: 'detected malware signature' });
      engine.ingestEvent({ sourceAgent: 'a2', action: 'SCAN', payload: 'detected port-scan pattern' });

      const criticalAlerts = engine.getAlerts('CRITICAL');
      expect(criticalAlerts.length).toBe(1);
      expect(criticalAlerts[0].severity).toBe('CRITICAL');

      const mediumAlerts = engine.getAlerts('MEDIUM');
      expect(mediumAlerts.length).toBe(1);
      expect(mediumAlerts[0].severity).toBe('MEDIUM');
    });

    it('escalates an alert to a formal incident report', () => {
      const engine = new SOCSentinelEngine();
      engine.addRule('r-exfil', 'Data Exfiltration', 'leak_secrets', 'HIGH', 'REVOKE_CREDENTIALS');

      const alert = engine.ingestEvent({
        sourceAgent: 'rogue-worker',
        action: 'TRANSMIT',
        payload: 'leak_secrets to external endpoint',
      });
      expect(alert).not.toBeNull();

      const incident = engine.createIncident(alert!.alertId, 'soc-analyst-1');
      expect(incident.incidentId).toMatch(/^inc-/);
      expect(incident.alertId).toBe(alert!.alertId);
      expect(incident.status).toBe('INVESTIGATING');
      expect(incident.assignedTo).toBe('soc-analyst-1');

      const updatedAlert = engine.getAlerts().find(a => a.alertId === alert!.alertId);
      expect(updatedAlert?.status).toBe('INVESTIGATING');
    });

    it('executes automated remediation against incidents', () => {
      const engine = new SOCSentinelEngine();
      engine.addRule('r-isolate', 'Threat', 'compromised', 'CRITICAL', 'ISOLATE_AGENT');

      const alert = engine.ingestEvent({
        sourceAgent: 'hacked-agent',
        action: 'EXEC',
        payload: 'compromised token',
      });
      const incident = engine.createIncident(alert!.alertId);

      const remediated = engine.autoRemediate(incident.incidentId);
      expect(remediated.status).toBe('RESOLVED');
      expect(remediated.resolution).toContain('Applied remediation action: ISOLATE_AGENT');
    });

    it('scans agent attack surfaces and calculates risk scores', () => {
      const engine = new SOCSentinelEngine();
      const report = engine.scanAttackSurface([
        {
          id: 'web-front',
          role: 'gateway',
          capabilities: ['http', 'auth', 'proxy'],
          permissions: ['network', 'filesystem', 'admin'],
          trustScore: 0.65,
        },
        {
          id: 'isolated-calc',
          role: 'worker',
          capabilities: ['math'],
          permissions: ['compute'],
          trustScore: 0.99,
        },
      ]);

      expect(report.totalAgents).toBe(2);
      expect(report.riskScore).toBeGreaterThanOrEqual(0);
      expect(report.riskScore).toBeLessThanOrEqual(100);
      expect(report.vulnerabilities.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('produces aggregate dashboard metrics', () => {
      const engine = new SOCSentinelEngine();
      const dash = engine.getDashboard();

      expect(dash.totalAlerts).toBeDefined();
      expect(dash.openIncidents).toBeDefined();
      expect(dash.postureScore).toBeGreaterThan(0);
      expect(dash.activeRulesCount).toBeGreaterThanOrEqual(0);
      expect(dash.recentEvents).toBeInstanceOf(Array);
    });
  });

  describe('CLI Commands', () => {
    it('alp sentinel rules list prints active detection rules', () => {
      const output = execFileSync('node', [CLI, 'sentinel', 'rules', 'list'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('SOC Sentinel — Detection Rules');
      expect(output).toContain('SQL Injection');
      expect(output).toContain('Privilege Escalation');
    });

    it('alp sentinel rules add registers a custom rule', () => {
      const output = execFileSync('node', [
        CLI, 'sentinel', 'rules', 'add',
        'rule-custom', 'DDoS Pattern',
        '--pattern', 'flood_request',
        '--severity', 'HIGH',
        '--action', 'BLOCK_IP'
      ], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('SOC Sentinel — Rule Added');
      expect(output).toContain('rule-custom');
      expect(output).toContain('DDoS Pattern');
      expect(output).toContain('HIGH');
    });

    it('alp sentinel scan runs attack surface scanner', () => {
      const output = execFileSync('node', [CLI, 'sentinel', 'scan'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('SOC Sentinel — Attack Surface Scan');
      expect(output).toContain('Overall Risk Score:');
      expect(output).toContain('Identified Vulnerabilities');
    });

    it('alp sentinel alerts shows simulated threat alerts', () => {
      const output = execFileSync('node', [CLI, 'sentinel', 'alerts'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('Active Alerts');
      expect(output).toContain('Open Alerts:');
    });

    it('alp sentinel incident escalates an alert to incident', () => {
      const output = execFileSync('node', [CLI, 'sentinel', 'incident', 'alt-demo-123'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('SOC Sentinel — Incident Created');
      expect(output).toContain('Incident ID:');
      expect(output).toContain('Status:');
    });

    it('alp sentinel remediate applies automated countermeasures', () => {
      const output = execFileSync('node', [CLI, 'sentinel', 'remediate', 'inc-demo-456', '--auto'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('SOC Sentinel — Remediation');
      expect(output).toContain('Remediated:');
    });

    it('alp sentinel dashboard displays comprehensive SOC posture', () => {
      const output = execFileSync('node', [CLI, 'sentinel', 'dashboard'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      expect(output).toContain('SOC SENTINEL AI — SECURITY OPERATIONS DASHBOARD');
      expect(output).toContain('SECURITY POSTURE SCORE:');
      expect(output).toContain('Active Detection Rules:');
    });
  });
});

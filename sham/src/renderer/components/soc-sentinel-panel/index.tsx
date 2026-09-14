import React, { useState, useMemo } from 'react';
import {
  SOCSentinelEngine,
  ThreatSeverity,
  RemediationAction,
  AttackSurfaceReport,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';
import { SentinelTab } from './shared.js';
import { PostureOverview } from './PostureOverview.js';
import { RulesManager } from './RulesManager.js';
import { AlertStream } from './AlertStream.js';
import { IncidentCenter } from './IncidentCenter.js';
import { SurfaceScanner } from './SurfaceScanner.js';

export function SOCSentinelPanel(): React.JSX.Element {
  const engine = useMemo(() => {
    const eng = new SOCSentinelEngine();
    // Default rules
    eng.addRule('rule-sqli', 'SQL Injection', 'sql injection|UNION SELECT', 'CRITICAL', 'ISOLATE_AGENT', 'Detects SQL injection attempts in agent inputs');
    eng.addRule('rule-xss', 'Cross-Site Scripting', '<script>|javascript:', 'HIGH', 'QUARANTINE_FILE', 'Detects XSS payload patterns');
    eng.addRule('rule-priv-esc', 'Privilege Escalation', 'sudo|chmod 777|privilege escalation', 'CRITICAL', 'REVOKE_CREDENTIALS', 'Detects unauthorized privilege escalation attempts');
    eng.addRule('rule-data-exfil', 'Data Exfiltration', 'exfiltration|leak_secrets', 'HIGH', 'BLOCK_IP', 'Detects data exfiltration patterns');
    eng.addRule('rule-brute-force', 'Brute Force', 'brute force|failed login 5', 'MEDIUM', 'BLOCK_IP', 'Detects brute force login attempts');
    eng.addRule('rule-unauth', 'Unauthorized Access', 'unauthorized|403 Forbidden', 'HIGH', 'REVOKE_CREDENTIALS', 'Detects unauthorized access attempts');

    // Ingest some initial security events
    eng.ingestEvent({ eventId: 'evt-init-1', source: 'agent-gateway', type: 'input', payload: 'Detected SQL injection pattern in query' });
    eng.ingestEvent({ eventId: 'evt-init-2', source: 'agent-worker-2', type: 'request', payload: 'Suspected privilege escalation attempt' });
    return eng;
  }, []);

  const [activeTab, setActiveTab] = useState<SentinelTab>('overview');
  const [tick, setTick] = useState(0);
  const [surfaceReport, setSurfaceReport] = useState<AttackSurfaceReport | null>(null);
  const [scanning, setScanning] = useState(false);

  const rules = useMemo(() => engine.listRules(), [engine, tick]);
  const alerts = useMemo(() => engine.getAlerts(), [engine, tick]);
  const dashboard = useMemo(() => engine.getDashboard(), [engine, tick]);

  // We track incidents in state from engine
  const [incidents, setIncidents] = useState(() => {
    const al = engine.getAlerts()[0];
    if (al) {
      return [engine.createIncident(al.alertId, 'Critical SQL injection in gateway worker')];
    }
    return [];
  });

  const handleSimulateThreat = () => {
    const attacks = [
      { source: 'agent-rogue', payload: 'Executing privilege escalation command' },
      { source: 'agent-worker-3', payload: 'Exfiltration of sensitive telemetry payloads' },
      { source: 'agent-gateway', payload: 'UNION SELECT * FROM user_credentials' },
    ];
    const picked = attacks[Math.floor(Math.random() * attacks.length)];
    engine.ingestEvent({ source: picked.source, type: 'exploit', payload: picked.payload });
    setTick(t => t + 1);
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    engine.toggleRule(ruleId, enabled);
    setTick(t => t + 1);
  };

  const handleAddRule = (ruleId: string, name: string, pattern: string, severity: ThreatSeverity, action: RemediationAction) => {
    engine.addRule(ruleId, name, pattern, severity, action);
    setTick(t => t + 1);
  };

  const handleEscalateToIncident = (alertId: string) => {
    const inc = engine.createIncident(alertId);
    setIncidents(prev => [inc, ...prev.filter(i => i.incidentId !== inc.incidentId)]);
    setTick(t => t + 1);
    setActiveTab('incidents');
  };

  const handleAutoRemediate = (incidentId: string) => {
    const remediated = engine.autoRemediate(incidentId);
    setIncidents(prev => prev.map(i => i.incidentId === incidentId ? remediated : i));
    setTick(t => t + 1);
  };

  const handleRunSurfaceScan = () => {
    setScanning(true);
    setTimeout(() => {
      const rep = engine.scanAttackSurface(['agent-gateway', 'agent-worker-1', 'agent-worker-2', 'agent-coordinator', 'agent-sentinel']);
      setSurfaceReport(rep);
      setScanning(false);
    }, 350);
  };

  const s = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
    header: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box' as const,
      background: 'var(--bg-secondary)',
    },
    tabNav: {
      display: 'flex',
      gap: '4px',
      borderBottom: '1px solid var(--border)',
      padding: '0 var(--spacing-md)',
      background: 'var(--bg-secondary)',
    },
    tabBtn: (active: boolean) => ({
      padding: '8px 16px',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid var(--accent-red)' : '2px solid transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }),
    body: {
      flex: 1,
      overflow: 'hidden',
      padding: 'var(--spacing-md)',
      display: 'flex',
      flexDirection: 'column' as const,
    },
  };

  return (
    <div style={s.container} data-testid="soc-sentinel-panel">
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--accent-red)' }}><Icon name="shield" size={20} /></span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>ALP SOC Sentinel AI</span>
              <span className="badge" style={{ background: 'var(--accent-red)22', color: 'var(--accent-red)' }}>Threat Defense</span>
              <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>v82.0.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time swarm attack surface monitoring & automated remediation mesh
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleSimulateThreat}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.8rem', background: 'var(--accent-red)' }}
          >
            <Icon name="alertTriangle" size={14} /> Inject Threat
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={s.tabNav}>
        <button style={s.tabBtn(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
          <Icon name="monitor" size={14} /> SOC Overview
        </button>
        <button style={s.tabBtn(activeTab === 'rules')} onClick={() => setActiveTab('rules')}>
          <Icon name="lock" size={14} /> Detection Rules ({rules.length})
        </button>
        <button style={s.tabBtn(activeTab === 'alerts')} onClick={() => setActiveTab('alerts')}>
          <Icon name="alertTriangle" size={14} /> Threat Alerts ({alerts.length})
        </button>
        <button style={s.tabBtn(activeTab === 'incidents')} onClick={() => setActiveTab('incidents')}>
          <Icon name="shield" size={14} /> Incidents & Containment ({incidents.length})
        </button>
        <button style={s.tabBtn(activeTab === 'surface')} onClick={() => setActiveTab('surface')}>
          <Icon name="search" size={14} /> Attack Surface Scan
        </button>
      </div>

      {/* Main View Area */}
      <div style={s.body}>
        {activeTab === 'overview' && (
          <PostureOverview
            dashboard={dashboard}
            onSimulateThreat={handleSimulateThreat}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'rules' && (
          <RulesManager
            rules={rules}
            onToggleRule={handleToggleRule}
            onAddRule={handleAddRule}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertStream
            alerts={alerts}
            onEscalateToIncident={handleEscalateToIncident}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentCenter
            incidents={incidents}
            onAutoRemediate={handleAutoRemediate}
          />
        )}

        {activeTab === 'surface' && (
          <SurfaceScanner
            report={surfaceReport}
            onRunScan={handleRunSurfaceScan}
            loading={scanning}
          />
        )}
      </div>
    </div>
  );
}

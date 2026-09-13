import {
  DetectionRule,
  ThreatAlert,
  IncidentReport,
  AttackSurfaceReport,
  SentinelDashboard,
  ThreatSeverity,
  RemediationAction,
} from '@autonomous-lifecycle-protocol-alp/parser';

export type SentinelTab = 'overview' | 'rules' | 'alerts' | 'incidents' | 'surface';

export interface SOCSentinelState {
  activeTab: SentinelTab;
  rules: DetectionRule[];
  alerts: ThreatAlert[];
  incidents: IncidentReport[];
  dashboard: SentinelDashboard;
}

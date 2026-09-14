import { VisualNode, VisualEdge, StudioProject, StudioTemplate, CapabilityListing, DAGValidationResult } from '@autonomous-lifecycle-protocol-alp/parser';

export type StudioTab = 'canvas' | 'templates' | 'marketplace' | 'export';

export interface AgentStudioState {
  project: StudioProject;
  selectedNodeId: string | null;
  activeTab: StudioTab;
  validation: DAGValidationResult;
  exportedAlp: string;
}

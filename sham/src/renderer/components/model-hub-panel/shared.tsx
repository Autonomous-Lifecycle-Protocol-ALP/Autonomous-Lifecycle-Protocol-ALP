import { HubModel, ModelBenchmark, ModelInvocationResult, ModelUsageRecord, ABTestResult } from '@autonomous-lifecycle-protocol-alp/parser';

export type HubTab = 'marketplace' | 'playground' | 'abTest' | 'usage';

export interface ModelHubState {
  models: HubModel[];
  selectedModelId: string;
  activeTab: HubTab;
}

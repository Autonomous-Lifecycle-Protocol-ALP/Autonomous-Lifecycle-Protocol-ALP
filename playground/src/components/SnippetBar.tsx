import { useCallback } from 'react';

const SNIPPETS: Record<string, string> = {
  task: `\n@task\n  id: task-new-feature\n  status: [ ]\n  description: "Implement new service component"\n  verify:\n    - "npm test"\n`,
  agent: `\n@agent\n  id: agent-specialist\n  role: "Automated Domain Specialist"\n`,
  feature: `\n@feature\n  id: feat-new-capability\n  status: [ ]\n  description: "Feature specification & requirements"\n`,
  workflow: `\n@workflow\n  id: wf-pipeline-flow\n  schedule: "0 0 * * *"\n  status: [ ]\n`,
  policy: `\n@policy\n  id: policy-security-guard\n  applies_to: "@agent-coder"\n  allow_paths:\n    - "src/**"\n  deny_paths:\n    - "config/keys/**"\n`,
  contract: `\n@contract\n  id: contract-service-boundary\n  from: "@agent-frontend"\n  to: "@agent-backend"\n  allows:\n    - "api.v1.*"\n`,
  vault: `\n@vault\n  id: vault-credentials\n  recipients:\n    - "devops.pub"\n`,
  rule: `\n@rule\n  id: rule-clean-architecture\n  description: "Do not import infrastructure logic directly into core entities"\n`,
  timeline: `\n@timeline\n  id: tl-scheduled-backup\n  cron: "0 0 * * *"\n  description: "Daily automated snapshot"\n  status: [ ]\n`,
  memory: `\n@memory\n  id: mem-knowledge-base\n  type: semantic-vector\n  scope: workspace\n`,
  swarm: `\n@swarm\n  id: swarm-federation\n  topology: mesh\n  consensus: pbft\n`,
  tenant: `\n@tenant\n  id: tenant-enterprise\n  tier: premium\n`,
  multimodal: `\n@multimodal\n  id: mm-stream-001\n  modalities:\n    - vision\n    - sensor\n  resolution: "1920x1080"\n  fps: 30\n`,
  vision_model: `\n@vision_model\n  id: model-clip-vit\n  backbone: clip\n  context_tokens: 4096\n`,
  action_space: `\n@action_space\n  id: act-space-001\n  domain: browser\n  actions:\n    - name: click\n      safety_level: low\n`,
};

const SNIPPET_KEYS = Object.keys(SNIPPETS);

interface SnippetBarProps {
  onInsert: (key: string) => void;
}

export function SnippetBar({ onInsert }: SnippetBarProps) {
  const handleInsert = useCallback(
    (key: string) => {
      if (SNIPPETS[key]) {
        onInsert(key);
      }
    },
    [onInsert]
  );

  return (
    <div className="snippet-bar" role="list" aria-label="Snippet insertion bar">
      <span className="snippet-label">Insert:</span>
      {SNIPPET_KEYS.map((key) => (
        <button key={key} className="snippet-chip" role="listitem" onClick={() => handleInsert(key)}>
          + @{key}
        </button>
      ))}
    </div>
  );
}

export { SNIPPETS };
export type { SnippetBarProps };

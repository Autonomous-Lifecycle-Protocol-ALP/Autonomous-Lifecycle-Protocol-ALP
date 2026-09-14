export type AgentRole =
  | 'planner'
  | 'developer'
  | 'security'
  | 'devops'
  | 'data'
  | 'eda'
  | 'quantum'
  | 'soc'
  | 'threat-intel'
  | 'zero-trust'
  | 'test-engineer'
  | 'code-reviewer'
  | 'release-manager'
  | 'api-designer'
  | 'architecture-visualizer';

export type AgentModel = 'gpt-4o' | 'claude-4' | 'gpt-5.5-cyber' | 'claude-opus-5';

export type AgentPermission = 'read' | 'write' | 'execute' | 'approve' | 'deploy' | 'admin';

export type AgentTemplate = 'tpl-coder' | 'tpl-reviewer' | 'tpl-tester' | 'tpl-fullstack';

export interface AgentRoleOption {
  value: AgentRole;
  label: string;
}

export interface AgentModelOption {
  value: AgentModel;
  label: string;
}

export interface AgentPermissionOption {
  value: AgentPermission;
  label: string;
}

export interface AgentTemplateOption {
  value: AgentTemplate;
  label: string;
  description: string;
  defaultRole: AgentRole;
  defaultModel: AgentModel;
  defaultPermissions: AgentPermission[];
}

export const AGENT_ROLES: AgentRoleOption[] = [
  { value: 'planner', label: 'Planner' },
  { value: 'developer', label: 'Developer' },
  { value: 'security', label: 'Security' },
  { value: 'devops', label: 'DevOps' },
  { value: 'data', label: 'Data' },
  { value: 'eda', label: 'EDA' },
  { value: 'quantum', label: 'Quantum' },
  { value: 'soc', label: 'SOC' },
  { value: 'threat-intel', label: 'Threat Intel' },
  { value: 'zero-trust', label: 'Zero Trust' },
  { value: 'test-engineer', label: 'Test Engineer' },
  { value: 'code-reviewer', label: 'Code Reviewer' },
  { value: 'release-manager', label: 'Release Manager' },
  { value: 'api-designer', label: 'API Designer' },
  { value: 'architecture-visualizer', label: 'Architecture Visualizer' },
];

export const AGENT_MODELS: AgentModelOption[] = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-4', label: 'Claude 4' },
  { value: 'gpt-5.5-cyber', label: 'GPT-5.5 Cyber' },
  { value: 'claude-opus-5', label: 'Claude Opus 5' },
];

export const AGENT_PERMISSIONS: AgentPermissionOption[] = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'execute', label: 'Execute' },
  { value: 'approve', label: 'Approve' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'admin', label: 'Admin' },
];

export const AGENT_TEMPLATES: AgentTemplateOption[] = [
  {
    value: 'tpl-coder',
    label: 'Code Agent',
    description: 'Generate, refactor, and fix code',
    defaultRole: 'developer',
    defaultModel: 'gpt-4o',
    defaultPermissions: ['read', 'write', 'execute'],
  },
  {
    value: 'tpl-reviewer',
    label: 'Code Reviewer',
    description: 'Review code for quality, security, and style',
    defaultRole: 'code-reviewer',
    defaultModel: 'gpt-5.5-cyber',
    defaultPermissions: ['read', 'approve'],
  },
  {
    value: 'tpl-tester',
    label: 'Test Agent',
    description: 'Generate and run tests',
    defaultRole: 'test-engineer',
    defaultModel: 'gpt-4o',
    defaultPermissions: ['read', 'write', 'execute'],
  },
  {
    value: 'tpl-fullstack',
    label: 'Full-Stack Swarm',
    description: 'Complete development workflow with review and test',
    defaultRole: 'developer',
    defaultModel: 'claude-opus-5',
    defaultPermissions: ['read', 'write', 'execute', 'approve'],
  },
];

export const TEMPLATE_NAMES: Record<AgentTemplate, string> = {
  'tpl-coder': 'Code Agent',
  'tpl-reviewer': 'Code Reviewer',
  'tpl-tester': 'Test Agent',
  'tpl-fullstack': 'Full-Stack Swarm',
};

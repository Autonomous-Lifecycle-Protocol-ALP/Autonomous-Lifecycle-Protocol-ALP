export interface Skill {
  id: string;
  name: string;
  category: 'analysis' | 'coding' | 'testing' | 'security';
  costPerCall: number;
  rating: number;
  description: string;
}

export const sampleSkills: Skill[] = [
  { id: 'skill-code-review', name: 'Automated Code Reviewer', category: 'analysis', costPerCall: 0.05, rating: 4.9, description: 'Analyzes pull requests for code quality and security bugs.' },
  { id: 'skill-unit-test-gen', name: 'Unit Test Generator', category: 'testing', costPerCall: 0.08, rating: 4.8, description: 'Auto-generates high-coverage Vitest and Jest unit tests.' },
  { id: 'skill-sec-auditor', name: 'Vault & Policy Auditor', category: 'security', costPerCall: 0.12, rating: 5.0, description: 'Audits @policy boundaries and sealed X25519 secret envelopes.' },
  { id: 'skill-refactor-bot', name: 'AST Refactoring Bot', category: 'coding', costPerCall: 0.06, rating: 4.7, description: 'Applies automated AST refactoring transformations.' },
];

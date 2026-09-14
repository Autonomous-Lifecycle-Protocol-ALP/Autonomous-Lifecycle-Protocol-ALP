export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tone: "formal" | "casual" | "neutral";
  systemPrompt: string;
  principles: string[];
  styleGuidelines: string[];
  examples: PersonaExample[];
  tools: string[];
  memoryNamespace: string;
  permissions: string[];
  limits: {
    maxConcurrentTasks: number;
    requiresReview: boolean;
    maxTokensPerTask?: number;
    maxToolCallsPerTask?: number;
  };
  modelPreferences: {
    primary: string;
    fallback: string;
    coding?: boolean;
  };
  version: string;
}

export interface PersonaExample {
  user: string;
  assistant: string;
  description: string;
}

export interface AgentRuntime {
  persona: AgentPersona;
  currentTaskId?: string;
  completedTaskIds: string[];
  status: "idle" | "active" | "blocked";
}

export abstract class BasePersona implements AgentPersona {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly color: string;
  abstract readonly tone: "formal" | "casual" | "neutral";
  abstract readonly systemPrompt: string;
  abstract readonly principles: string[];
  abstract readonly styleGuidelines: string[];
  abstract readonly examples: PersonaExample[];
  abstract readonly tools: string[];
  abstract readonly memoryNamespace: string;
  abstract readonly permissions: string[];
  abstract readonly limits: {
    maxConcurrentTasks: number;
    requiresReview: boolean;
    maxTokensPerTask?: number;
    maxToolCallsPerTask?: number;
  };
  abstract readonly modelPreferences: {
    primary: string;
    fallback: string;
    coding?: boolean;
  };
  abstract readonly version: string;
}

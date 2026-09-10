import type { AgentPersona, PersonaExample } from "../base.js";
import { ALL_PERSONAS } from "./types.js";

export class AgentRegistry {
  private readonly personas: Map<string, AgentPersona> = new Map();

  constructor(personas: AgentPersona[] = ALL_PERSONAS) {
    for (const persona of personas) {
      this.personas.set(persona.id, persona);
    }
  }

  get(id: string): AgentPersona | undefined {
    return this.personas.get(id);
  }

  list(): AgentPersona[] {
    return Array.from(this.personas.values());
  }

  register(persona: AgentPersona): void {
    this.validate(persona);
    this.personas.set(persona.id, persona);
  }

  unregister(id: string): boolean {
    return this.personas.delete(id);
  }

  serialize(personaId: string): Record<string, unknown> | undefined {
    const persona = this.get(personaId);
    if (!persona) return undefined;
    return {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      systemPrompt: persona.systemPrompt,
      principles: persona.principles,
      tools: persona.tools,
      memoryNamespace: persona.memoryNamespace,
      permissions: persona.permissions,
      limits: persona.limits,
      modelPreferences: persona.modelPreferences,
      version: persona.version,
    };
  }

  private validate(persona: AgentPersona): void {
    if (!persona.id || !persona.name || !persona.systemPrompt) {
      throw new Error(`Invalid persona: missing required fields (id, name, systemPrompt)`);
    }
    if (this.personas.has(persona.id)) {
      throw new Error(`Persona with id "${persona.id}" is already registered`);
    }
  }
}

export const agentRegistry = new AgentRegistry();

export class PersonaBuilder {
  private config: AgentPersona;

  constructor(id: string, name: string) {
    this.config = {
      id,
      name,
      description: "",
      icon: "🤖",
      color: "#6B7280",
      tone: "neutral",
      systemPrompt: "",
      principles: [],
      styleGuidelines: [],
      examples: [],
      tools: [],
      memoryNamespace: id,
      permissions: ["read"],
      limits: { maxConcurrentTasks: 1, requiresReview: false },
      modelPreferences: { primary: "gpt-4o", fallback: "claude-sonnet-4-20250514" },
      version: "0.1.0",
    };
  }

  description(desc: string): this {
    this.config.description = desc;
    return this;
  }

  icon(icon: string): this {
    this.config.icon = icon;
    return this;
  }

  color(color: string): this {
    this.config.color = color;
    return this;
  }

  tone(tone: "formal" | "casual" | "neutral"): this {
    this.config.tone = tone;
    return this;
  }

  systemPrompt(prompt: string): this {
    this.config.systemPrompt = prompt;
    return this;
  }

  principles(principles: string[]): this {
    this.config.principles = [...principles];
    return this;
  }

  styleGuidelines(guidelines: string[]): this {
    this.config.styleGuidelines = [...guidelines];
    return this;
  }

  examples(examples: PersonaExample[]): this {
    this.config.examples = [...examples];
    return this;
  }

  tools(tools: string[]): this {
    this.config.tools = [...tools];
    return this;
  }

  memoryNamespace(ns: string): this {
    this.config.memoryNamespace = ns;
    return this;
  }

  permissions(perms: string[]): this {
    this.config.permissions = [...perms];
    return this;
  }

  limits(limits: { maxConcurrentTasks: number; requiresReview: boolean; maxTokensPerTask?: number; maxToolCallsPerTask?: number }): this {
    this.config.limits = { ...limits };
    return this;
  }

  modelPreferences(prefs: { primary: string; fallback: string; coding?: boolean }): this {
    this.config.modelPreferences = { ...prefs };
    return this;
  }

  version(version: string): this {
    this.config.version = version;
    return this;
  }

  build(): AgentPersona {
    return { ...this.config };
  }

  buildAndRegister(registry: AgentRegistry): AgentPersona {
    const persona = this.build();
    registry.register(persona);
    return persona;
  }
}

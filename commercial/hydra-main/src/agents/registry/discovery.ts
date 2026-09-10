import type { AgentPersona } from "../base.js";
import { AgentRegistry, agentRegistry } from "./agent-registry.js";

export function getAgent(id: string, registry: AgentRegistry = agentRegistry): AgentPersona | undefined {
  return registry.get(id);
}

export function listAgents(registry: AgentRegistry = agentRegistry): AgentPersona[] {
  return registry.list();
}

export function listAgentsByPermission(
  permission: string,
  registry: AgentRegistry = agentRegistry,
): AgentPersona[] {
  return listAgents(registry).filter((p) => p.permissions.includes(permission));
}

export function listAgentsByTool(toolId: string, registry: AgentRegistry = agentRegistry): AgentPersona[] {
  return listAgents(registry).filter((p) => p.tools.includes(toolId));
}

export interface AgentSearchCriteria {
  ids?: string[];
  permissions?: string[];
  tools?: string[];
  searchTerm?: string;
}

export function searchAgents(
  criteria: AgentSearchCriteria,
  registry: AgentRegistry = agentRegistry,
): AgentPersona[] {
  let results = listAgents(registry);

  if (criteria.ids && criteria.ids.length > 0) {
    results = results.filter((p) => criteria.ids!.includes(p.id));
  }

  if (criteria.permissions && criteria.permissions.length > 0) {
    results = results.filter((p) =>
      criteria.permissions!.some((perm) => p.permissions.includes(perm)),
    );
  }

  if (criteria.tools && criteria.tools.length > 0) {
    results = results.filter((p) =>
      criteria.tools!.some((tool) => p.tools.includes(tool)),
    );
  }

  if (criteria.searchTerm) {
    const term = criteria.searchTerm.toLowerCase();
    results = results.filter((p) => {
      const text = [p.id, p.name, p.description, ...p.principles, ...p.tools].join(" ").toLowerCase();
      return text.includes(term);
    });
  }

  return results;
}

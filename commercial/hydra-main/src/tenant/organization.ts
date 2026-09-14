export interface Organization {
  id: string;
  name: string;
  plan: "community" | "pro" | "enterprise" | "custom";
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  teamIds: string[];
  role: "owner" | "admin" | "member" | "viewer";
  createdAt: string;
}

export class TenantManager {
  private readonly organizations: Map<string, Organization> = new Map();
  private readonly teams: Map<string, Team> = new Map();
  private readonly users: Map<string, User> = new Map();
  private readonly orgMembers: Map<string, Set<string>> = new Map();
  private readonly teamMembers: Map<string, Set<string>> = new Map();

  createOrganization(name: string, plan: Organization["plan"]): Organization {
    const org: Organization = {
      id: `org-${Date.now()}`,
      name,
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.organizations.set(org.id, org);
    this.orgMembers.set(org.id, new Set());
    return org;
  }

  createTeam(organizationId: string, name: string): Team {
    const team: Team = {
      id: `team-${Date.now()}`,
      organizationId,
      name,
      createdAt: new Date().toISOString(),
    };
    this.teams.set(team.id, team);
    this.teamMembers.set(team.id, new Set());
    return team;
  }

  addUser(user: Omit<User, "id" | "createdAt">): User {
    const full: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.set(full.id, full);
    const members = this.orgMembers.get(full.organizationId);
    if (members) members.add(full.id);
    for (const teamId of full.teamIds) {
      this.teamMembers.get(teamId)?.add(full.id);
    }
    return full;
  }

  getOrganization(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  getTeam(id: string): Team | undefined {
    return this.teams.get(id);
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getOrganizationMembers(orgId: string): User[] {
    const memberIds = this.orgMembers.get(orgId);
    if (!memberIds) return [];
    return Array.from(memberIds).map((id) => this.users.get(id)).filter(Boolean) as User[];
  }
}

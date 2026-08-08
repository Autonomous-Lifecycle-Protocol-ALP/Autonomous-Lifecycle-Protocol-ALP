import { SoftwareProject, Milestone, ResourceAllocation } from "../types";

export class SoftwarePlanningEngine {
  private projects: Map<string, SoftwareProject> = new Map();

  createProject(project: Omit<SoftwareProject, "createdAt" | "updatedAt">): SoftwareProject {
    const now = new Date().toISOString();
    const full: SoftwareProject = { ...project, createdAt: now, updatedAt: now };
    this.projects.set(full.id, full);
    return full;
  }

  getProject(id: string): SoftwareProject | undefined {
    return this.projects.get(id);
  }

  listProjects(): SoftwareProject[] {
    return Array.from(this.projects.values());
  }

  addMilestone(projectId: string, milestone: Omit<Milestone, "id">): Milestone | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const ms: Milestone = {
      id: `${projectId}-ms-${project.milestones.length + 1}`,
      ...milestone,
    };
    project.milestones.push(ms);
    project.updatedAt = new Date().toISOString();
    return ms;
  }

  allocateResource(projectId: string, resource: Omit<ResourceAllocation, "id" | "allocatedAt">): ResourceAllocation | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const res: ResourceAllocation = {
      id: `${projectId}-res-${project.resources.length + 1}`,
      ...resource,
      allocatedAt: new Date().toISOString(),
    };
    project.resources.push(res);
    project.updatedAt = new Date().toISOString();
    return res;
  }

  updateProjectStatus(projectId: string, status: SoftwareProject["status"]): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;
    project.status = status;
    project.updatedAt = new Date().toISOString();
    return true;
  }
}

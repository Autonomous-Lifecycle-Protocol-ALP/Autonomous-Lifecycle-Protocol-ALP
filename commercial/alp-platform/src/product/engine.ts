import { ProductPlan, RoadmapMilestone } from "../types";

export class ProductPlanningEngine {
  private plans: Map<string, ProductPlan> = new Map();

  createPlan(plan: Omit<ProductPlan, "id">): ProductPlan {
    const full: ProductPlan = {
      id: `plan-${this.plans.size + 1}`,
      ...plan,
    };
    this.plans.set(full.id, full);
    return full;
  }

  addRoadmapMilestone(planId: string, milestone: Omit<RoadmapMilestone, "id">): RoadmapMilestone | undefined {
    const plan = this.plans.get(planId);
    if (!plan) return undefined;

    const ms: RoadmapMilestone = {
      id: `${planId}-rm-${plan.roadmap.length + 1}`,
      ...milestone,
    };
    plan.roadmap.push(ms);
    return ms;
  }

  getPlan(id: string): ProductPlan | undefined {
    return this.plans.get(id);
  }

  listPlans(): ProductPlan[] {
    return Array.from(this.plans.values());
  }

  updatePlanStatus(id: string, status: ProductPlan["status"]): boolean {
    const plan = this.plans.get(id);
    if (!plan) return false;
    plan.status = status;
    return true;
  }
}

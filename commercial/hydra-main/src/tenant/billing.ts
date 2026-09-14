import { v4 as uuidv4 } from "uuid";

export interface Plan {
  id: string;
  name: string;
  organizationId: string;
  priceUsdPerMonth: number;
  tiers: BillingTier[];
  features: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingTier {
  id: string;
  name: string;
  priceUsdPerMonth: number;
  limits: Record<string, number>;
  features: string[];
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  metric: string;
  amount: number;
  unit: string;
  costUsd: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  items: InvoiceItem[];
  subtotal: number;
  taxUsd: number;
  total: number;
  status: "draft" | "open" | "paid" | "void";
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
}

export class BillingManager {
  private plans: Map<string, Plan> = new Map();
  private usages: Map<string, UsageRecord[]> = new Map();
  private invoices: Map<string, Invoice[]> = new Map();
  private subscriptions: Map<string, { planId: string; startedAt: string }> = new Map();
  private readonly defaultTaxRate = 0.08;

  addPlan(plan: Omit<Plan, "id" | "createdAt" | "updatedAt">): Plan {
    const now = new Date().toISOString();
    const fullPlan: Plan = {
      ...plan,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.plans.set(fullPlan.id, fullPlan);
    return fullPlan;
  }

  getPlan(id: string): Plan | undefined {
    return this.plans.get(id);
  }

  listPlans(organizationId?: string): Plan[] {
    const results = Array.from(this.plans.values());
    return organizationId ? results : results;
  }

  subscribeOrganization(organizationId: string, planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    this.subscriptions.set(organizationId, {
      planId,
      startedAt: new Date().toISOString(),
    });

    if (!this.usages.has(organizationId)) {
      this.usages.set(organizationId, []);
    }
    if (!this.invoices.has(organizationId)) {
      this.invoices.set(organizationId, []);
    }

    return true;
  }

  recordUsage(
    organizationId: string,
    metric: string,
    amount: number,
    unit: string,
    costUsd: number,
    metadata?: Record<string, unknown>,
  ): UsageRecord {
    const record: UsageRecord = {
      id: uuidv4(),
      organizationId,
      metric,
      amount,
      unit,
      costUsd,
      timestamp: new Date().toISOString(),
      metadata,
    };

    if (!this.usages.has(organizationId)) {
      this.usages.set(organizationId, []);
    }
    this.usages.get(organizationId)!.push(record);
    return record;
  }

  getUsage(organizationId: string, metric?: string, period?: { start: string; end: string }): UsageRecord[] {
    const records = this.usages.get(organizationId) || [];
    let filtered = records;
    if (metric) filtered = filtered.filter((r) => r.metric === metric);
    if (period) {
      filtered = filtered.filter(
        (r) => r.timestamp >= period.start && r.timestamp <= period.end,
      );
    }
    return filtered;
  }

  getUsageTotal(organizationId: string, metric?: string): number {
    return this.getUsage(organizationId, metric).reduce((sum, r) => sum + r.amount, 0);
  }

  generateInvoice(organizationId: string, periodStart: string, periodEnd: string): Invoice {
    const subscription = this.subscriptions.get(organizationId);
    const plan = subscription ? this.plans.get(subscription.planId) : undefined;
    const usage = this.getUsage(organizationId, undefined, { start: periodStart, end: periodEnd });

    const items: InvoiceItem[] = [];

    if (plan && plan.priceUsdPerMonth > 0) {
      items.push({
        description: `Plan: ${plan.name}`,
        amount: plan.priceUsdPerMonth,
        quantity: 1,
        unitPrice: plan.priceUsdPerMonth,
      });
    }

    for (const record of usage) {
      items.push({
        description: `${record.metric} (${record.unit})`,
        amount: record.costUsd,
        quantity: record.amount,
        unitPrice: record.amount > 0 ? record.costUsd / record.amount : 0,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxUsd = subtotal * this.defaultTaxRate;
    const total = subtotal + taxUsd;

    const invoice: Invoice = {
      id: uuidv4(),
      organizationId,
      periodStart,
      periodEnd,
      items,
      subtotal,
      taxUsd,
      total,
      status: "draft",
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (!this.invoices.has(organizationId)) {
      this.invoices.set(organizationId, []);
    }
    this.invoices.get(organizationId)!.push(invoice);

    return invoice;
  }

  getInvoices(organizationId: string): Invoice[] {
    return this.invoices.get(organizationId) || [];
  }

  markPaid(invoiceId: string): boolean {
    for (const invoices of this.invoices.values()) {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (invoice) {
        invoice.status = "paid";
        invoice.paidAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  getSubscription(organizationId: string): { planId: string; startedAt: string } | undefined {
    return this.subscriptions.get(organizationId);
  }
}

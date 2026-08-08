export interface ExecutionQuota {
  id: string;
  maxExecutions: number;
  windowMs: number;
  used: number;
  resetAt: string;
  createdAt: string;
}

export class ExecutionQuotaEngine {
  private quotas = new Map<string, ExecutionQuota>();

  createQuota(id: string, maxExecutions: number, windowMs: number): ExecutionQuota {
    const quota: ExecutionQuota = {
      id,
      maxExecutions,
      windowMs,
      used: 0,
      resetAt: new Date(Date.now() + windowMs).toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.quotas.set(id, quota);
    return quota;
  }

  checkQuota(quotaId: string): { allowed: boolean; remaining: number; resetAt: string } {
    const quota = this.quotas.get(quotaId);
    if (!quota) {
      return { allowed: false, remaining: 0, resetAt: '' };
    }

    const now = new Date();
    const resetAt = new Date(quota.resetAt);
    if (now >= resetAt) {
      quota.used = 0;
      quota.resetAt = new Date(now.getTime() + quota.windowMs).toISOString();
    }

    const remaining = Math.max(0, quota.maxExecutions - quota.used);
    return {
      allowed: quota.used < quota.maxExecutions,
      remaining,
      resetAt: quota.resetAt,
    };
  }

  recordExecution(quotaId: string): { allowed: boolean; remaining: number } {
    const quota = this.quotas.get(quotaId);
    if (!quota) {
      return { allowed: false, remaining: 0 };
    }

    this.checkQuota(quotaId);
    quota.used += 1;
    const remaining = Math.max(0, quota.maxExecutions - quota.used);
    return {
      allowed: quota.used <= quota.maxExecutions,
      remaining,
    };
  }

  getQuota(id: string): ExecutionQuota | undefined {
    return this.quotas.get(id);
  }

  resetQuota(id: string): void {
    const quota = this.quotas.get(id);
    if (quota) {
      quota.used = 0;
      quota.resetAt = new Date(Date.now() + quota.windowMs).toISOString();
    }
  }
}

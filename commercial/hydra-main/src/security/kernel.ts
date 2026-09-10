export interface Capability {
  action: string;
  scope: string;
  expiresAt?: string;
}

export interface SecurityContext {
  userId: string;
  organizationId: string;
  teamId?: string;
  capabilities: Capability[];
}

export class SecurityKernel {
  check(context: SecurityContext, action: string, scope: string): boolean {
    if (context.capabilities.some((c) => c.action === "*" && c.scope === "*")) {
      return true;
    }
    const now = new Date();
    const valid = context.capabilities.filter((c) => {
      if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      if (c.action !== "*" && c.action !== action) return false;
      if (c.scope === "*") return true;
      const pattern = c.scope.replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(scope);
    });
    return valid.length > 0;
  }
}

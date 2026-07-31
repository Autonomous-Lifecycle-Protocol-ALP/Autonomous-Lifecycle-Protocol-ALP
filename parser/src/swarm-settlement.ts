/**
 * SwarmSettlementEngine — v56.0.0 Distributed Swarm Settlement Engine
 *
 * Manages micro-metered token balances, escrow deposits, invoice generation,
 * and automated balance settlement for inter-agent skill execution.
 */

export interface AgentAccount {
  agentId: string;
  balance: number;
  escrowLocked: number;
  updatedAt: string;
}

export interface SettlementInvoice {
  invoiceId: string;
  callerAgent: string;
  providerAgent: string;
  skillName: string;
  amount: number;
  status: 'PENDING' | 'SETTLED' | 'REJECTED';
  createdAt: string;
  settledAt?: string;
}

export interface EscrowDeposit {
  escrowId: string;
  agentId: string;
  amount: number;
  reason: string;
  lockedAt: string;
}

export class SwarmSettlementEngine {
  private accounts: Map<string, AgentAccount> = new Map();
  private invoices: Map<string, SettlementInvoice> = new Map();
  private escrows: Map<string, EscrowDeposit> = new Map();

  /**
   * Deposit tokens into an agent account balance.
   */
  public deposit(agentId: string, amount: number): AgentAccount {
    const account = this.getOrCreateAccount(agentId);
    account.balance += amount;
    account.updatedAt = new Date().toISOString();
    return account;
  }

  /**
   * Lock funds in escrow for a pending skill invocation.
   */
  public lockEscrow(agentId: string, amount: number, reason: string): EscrowDeposit | undefined {
    const account = this.getOrCreateAccount(agentId);
    const available = account.balance - account.escrowLocked;
    if (available < amount) return undefined;

    account.escrowLocked += amount;
    const escrowId = `escrow-${Date.now()}`;
    const deposit: EscrowDeposit = {
      escrowId,
      agentId,
      amount,
      reason,
      lockedAt: new Date().toISOString(),
    };

    this.escrows.set(escrowId, deposit);
    return deposit;
  }

  /**
   * Create an invoice for a completed skill execution.
   */
  public createInvoice(callerAgent: string, providerAgent: string, skillName: string, amount: number): SettlementInvoice {
    const invoiceId = `inv-${Date.now()}`;
    const invoice: SettlementInvoice = {
      invoiceId,
      callerAgent,
      providerAgent,
      skillName,
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.invoices.set(invoiceId, invoice);
    return invoice;
  }

  /**
   * Settle an invoice by transferring funds from caller to provider.
   */
  public settleInvoice(invoiceId: string, escrowId?: string): boolean {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.status === 'SETTLED') return false;

    const callerAcc = this.getOrCreateAccount(invoice.callerAgent);
    const providerAcc = this.getOrCreateAccount(invoice.providerAgent);

    // If escrow provided, release escrow lock
    if (escrowId) {
      const deposit = this.escrows.get(escrowId);
      if (deposit) {
        callerAcc.escrowLocked = Math.max(0, callerAcc.escrowLocked - deposit.amount);
        this.escrows.delete(escrowId);
      }
    }

    if (callerAcc.balance < invoice.amount) {
      invoice.status = 'REJECTED';
      return false;
    }

    callerAcc.balance -= invoice.amount;
    providerAcc.balance += invoice.amount;
    invoice.status = 'SETTLED';
    invoice.settledAt = new Date().toISOString();

    return true;
  }

  public getAccount(agentId: string): AgentAccount | undefined {
    return this.accounts.get(agentId);
  }

  public getInvoice(invoiceId: string): SettlementInvoice | undefined {
    return this.invoices.get(invoiceId);
  }

  private getOrCreateAccount(agentId: string): AgentAccount {
    let account = this.accounts.get(agentId);
    if (!account) {
      account = {
        agentId,
        balance: 100.0, // Default initial test grant
        escrowLocked: 0,
        updatedAt: new Date().toISOString(),
      };
      this.accounts.set(agentId, account);
    }
    return account;
  }
}

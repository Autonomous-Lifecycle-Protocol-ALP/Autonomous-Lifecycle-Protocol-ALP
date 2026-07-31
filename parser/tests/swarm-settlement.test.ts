import { describe, it, expect } from 'vitest';
import { SwarmSettlementEngine } from '../src/swarm-settlement';

describe('v56.0.0 SwarmSettlementEngine — Distributed Swarm Micro-Settlement', () => {
  it('initializes agent balances and handles token deposits', () => {
    const engine = new SwarmSettlementEngine();
    const account = engine.deposit('agent-auth', 50.0);

    expect(account.agentId).toBe('agent-auth');
    expect(account.balance).toBe(150.0);
  });

  it('locks escrow funds for pending skill executions', () => {
    const engine = new SwarmSettlementEngine();
    const deposit = engine.lockEscrow('agent-caller', 25.0, 'Code Audit Execution');

    expect(deposit).toBeDefined();
    expect(deposit?.amount).toBe(25.0);

    const account = engine.getAccount('agent-caller');
    expect(account?.escrowLocked).toBe(25.0);
  });

  it('creates and settles micro-metered invoices between agents', () => {
    const engine = new SwarmSettlementEngine();
    const escrow = engine.lockEscrow('agent-caller', 10.0, 'Unit Test Generation');
    const invoice = engine.createInvoice('agent-caller', 'agent-provider', 'UnitTestGen', 10.0);

    const settled = engine.settleInvoice(invoice.invoiceId, escrow?.escrowId);
    expect(settled).toBe(true);

    const callerAcc = engine.getAccount('agent-caller');
    const providerAcc = engine.getAccount('agent-provider');

    expect(callerAcc?.balance).toBe(90.0);
    expect(providerAcc?.balance).toBe(110.0);
    expect(callerAcc?.escrowLocked).toBe(0.0);
  });
});

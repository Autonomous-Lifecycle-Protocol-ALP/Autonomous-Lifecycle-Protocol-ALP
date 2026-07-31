import { Command } from 'commander';
import { SwarmSettlementEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerSettleSwarmCommand(program: Command) {
  program
    .command('settle-swarm')
    .description('Manage agent micro-metered balances, escrows, and invoice settlements (v56.0.0)')
    .option('--caller <agent>', 'Caller agent ID', 'agent-caller')
    .option('--provider <agent>', 'Provider agent ID', 'agent-provider')
    .option('--skill <name>', 'Skill name for the invoice', 'CodeAudit')
    .option('--amount <tokens>', 'Token amount', '10.0')
    .action((options) => {
      const engine = new SwarmSettlementEngine();
      const amount = parseFloat(options.amount);

      // Deposit initial funds to caller
      engine.deposit(options.caller, 50.0);

      // Lock escrow
      const escrow = engine.lockEscrow(options.caller, amount, `Escrow for ${options.skill}`);

      // Create invoice
      const invoice = engine.createInvoice(options.caller, options.provider, options.skill, amount);

      // Settle
      const settled = engine.settleInvoice(invoice.invoiceId, escrow?.escrowId);

      const callerAcc = engine.getAccount(options.caller);
      const providerAcc = engine.getAccount(options.provider);

      console.log('\n💰 Swarm Settlement Engine (v56.0.0)');
      console.log('=====================================');
      console.log(`  Skill:          ${options.skill}`);
      console.log(`  Amount:         ${amount} tokens`);
      console.log(`  Caller:         ${options.caller} (balance: ${callerAcc?.balance.toFixed(2)})`);
      console.log(`  Provider:       ${options.provider} (balance: ${providerAcc?.balance.toFixed(2)})`);
      console.log(`  Escrow ID:      ${escrow?.escrowId || 'N/A'}`);
      console.log(`  Invoice ID:     ${invoice.invoiceId}`);
      console.log(`  Settlement:     ${settled ? '✅ SETTLED' : '❌ REJECTED'}\n`);
    });
}

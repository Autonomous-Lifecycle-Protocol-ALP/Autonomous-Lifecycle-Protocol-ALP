// Barrel file: imports all ALP JSON schemas and exports them as a single namespace.
// Add new schema imports here when new .schema.json files are added to this package.
import schema_agent from './agent.schema.json' with { type: 'json' };
import schema_arch_decomposer from './arch_decomposer.schema.json' with { type: 'json' };
import schema_artifact from './artifact.schema.json' with { type: 'json' };
import schema_asset_context from './asset_context.schema.json' with { type: 'json' };
import schema_code_index from './code_index.schema.json' with { type: 'json' };
import schema_code_transform from './code_transform.schema.json' with { type: 'json' };
import schema_common from './common.schema.json' with { type: 'json' };
import schema_consensus_vote from './consensus_vote.schema.json' with { type: 'json' };
import schema_constraint from './constraint.schema.json' with { type: 'json' };
import schema_context from './context.schema.json' with { type: 'json' };
import schema_contract from './contract.schema.json' with { type: 'json' };
import schema_cost_budget from './cost_budget.schema.json' with { type: 'json' };
import schema_crdt_sync from './crdt_sync.schema.json' with { type: 'json' };
import schema_decision from './decision.schema.json' with { type: 'json' };
import schema_dependency from './dependency.schema.json' with { type: 'json' };
import schema_did_identity from './did_identity.schema.json' with { type: 'json' };
import schema_edge_model from './edge_model.schema.json' with { type: 'json' };
import schema_eval_suite from './eval_suite.schema.json' with { type: 'json' };
import schema_event from './event.schema.json' with { type: 'json' };
import schema_event_mesh from './event_mesh.schema.json' with { type: 'json' };
import schema_feature from './feature.schema.json' with { type: 'json' };
import schema_formal_proof from './formal_proof.schema.json' with { type: 'json' };
import schema_goal from './goal.schema.json' with { type: 'json' };
import schema_macro from './macro.schema.json' with { type: 'json' };
import schema_memory from './memory.schema.json' with { type: 'json' };
import schema_package from './package.schema.json' with { type: 'json' };
import schema_plugin from './plugin.schema.json' with { type: 'json' };
import schema_policy from './policy.schema.json' with { type: 'json' };
import schema_project from './project.schema.json' with { type: 'json' };
import schema_prompt_optimizer from './prompt_optimizer.schema.json' with { type: 'json' };
import schema_repo from './repo.schema.json' with { type: 'json' };
import schema_resource from './resource.schema.json' with { type: 'json' };
import schema_rule from './rule.schema.json' with { type: 'json' };
import schema_sandbox_env from './sandbox_env.schema.json' with { type: 'json' };
import schema_self_heal from './self_heal.schema.json' with { type: 'json' };
import schema_state from './state.schema.json' with { type: 'json' };
import schema_swarm from './swarm.schema.json' with { type: 'json' };
import schema_swarm_marketplace from './swarm_marketplace.schema.json' with { type: 'json' };
import schema_task from './task.schema.json' with { type: 'json' };
import schema_tenant_mesh from './tenant_mesh.schema.json' with { type: 'json' };
import schema_timeline from './timeline.schema.json' with { type: 'json' };
import schema_trace from './trace.schema.json' with { type: 'json' };
import schema_type from './type.schema.json' with { type: 'json' };
import schema_vault from './vault.schema.json' with { type: 'json' };
import schema_vector_store from './vector_store.schema.json' with { type: 'json' };
import schema_verification from './verification.schema.json' with { type: 'json' };
import schema_workflow from './workflow.schema.json' with { type: 'json' };
import schema_workspace from './workspace.schema.json' with { type: 'json' };
import schema_zk_proof from './zk_proof.schema.json' with { type: 'json' };

const schemas = {
  "agent": schema_agent,
  "arch_decomposer": schema_arch_decomposer,
  "artifact": schema_artifact,
  "asset_context": schema_asset_context,
  "code_index": schema_code_index,
  "code_transform": schema_code_transform,
  "common": schema_common,
  "consensus_vote": schema_consensus_vote,
  "constraint": schema_constraint,
  "context": schema_context,
  "contract": schema_contract,
  "cost_budget": schema_cost_budget,
  "crdt_sync": schema_crdt_sync,
  "decision": schema_decision,
  "dependency": schema_dependency,
  "did_identity": schema_did_identity,
  "edge_model": schema_edge_model,
  "eval_suite": schema_eval_suite,
  "event": schema_event,
  "event_mesh": schema_event_mesh,
  "feature": schema_feature,
  "formal_proof": schema_formal_proof,
  "goal": schema_goal,
  "macro": schema_macro,
  "memory": schema_memory,
  "package": schema_package,
  "plugin": schema_plugin,
  "policy": schema_policy,
  "project": schema_project,
  "prompt_optimizer": schema_prompt_optimizer,
  "repo": schema_repo,
  "resource": schema_resource,
  "rule": schema_rule,
  "sandbox_env": schema_sandbox_env,
  "self_heal": schema_self_heal,
  "state": schema_state,
  "swarm": schema_swarm,
  "swarm_marketplace": schema_swarm_marketplace,
  "task": schema_task,
  "tenant_mesh": schema_tenant_mesh,
  "timeline": schema_timeline,
  "trace": schema_trace,
  "type": schema_type,
  "vault": schema_vault,
  "vector_store": schema_vector_store,
  "verification": schema_verification,
  "workflow": schema_workflow,
  "workspace": schema_workspace,
  "zk_proof": schema_zk_proof,
};
export default schemas;

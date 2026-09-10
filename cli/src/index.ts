#!/usr/bin/env node
import { Command } from 'commander';
import * as commands from './commands';
const program = new Command();

program
  .name('alp')
  .description('Autonomous Lifecycle Protocol (ALP) CLI')
  .version('80.0.0');

program
  .command('init')
  .description('Initialize a new ALP project in the current directory')
  .action(commands.initCommand);

program
  .command('integrate')
  .description('Scaffold AI agent and CI/CD integration files (cursor, claude, github, all)')
  .argument('[target]', 'Target integration: cursor, claude, github, all', 'all')
  .option('-f, --force', 'Overwrite existing integration files')
  .action((target, opts) => {
    commands.integrateCommand(target, opts);
  });

program
  .command('validate')
  .description('Validate all .alp files against schemas')
  .argument('[file]', 'Optional specific file to validate')
  .action(commands.validateCommand);

program
  .command('lint')
  .description('Lint the ALP workspace for style conventions and best practices')
  .action(commands.lintCommand);

program
  .command('test')
  .description('Run ALP tests with pass/fail reporting and optional coverage')
  .option('--coverage', 'Show test coverage report')
  .option('--file <path>', 'Run tests from a specific file')
  .action(commands.testCommand);

program
  .command('format')
  .description('Format .alp files with consistent indentation and style')
  .option('--check', 'Check formatting without writing changes')
  .action(commands.formatCommand);

program
  .command('verify')
  .description('Execute quality gates and verification scripts for a task')
  .argument('<taskId>', 'The ID of the task to verify')
  .option('--formal <policyId>', 'Run formal model-checking verification for a policy (v10.9.0)')
  .action(commands.verifyCommand);

program
  .command('doctor')
  .description('Diagnose workspace health and environment configuration')
  .action(commands.doctorCommand);

program
  .command('upgrade')
  .description('Upgrade legacy ALP files to the latest specification version')
  .action(commands.upgradeCommand);

program
  .command('import')
  .description('Import legacy markdown rules (.cursorrules, etc.) into ALP format')
  .argument('[file]', 'Optional specific file to import')
  .action(commands.importCommand);

program
  .command('graph')
  .description('Visualize the project dependency graph')
  .argument('[file]', 'Optional specific file to graph')
  .option('--mermaid', 'Output dependency graph in Mermaid diagram format')
  .option('--json', 'Output graph topology as JSON')
  .action((file, opts) => commands.graphCommand(file, opts));

program
  .command('status')
  .description('Show project state and progress')
  .action(commands.statusCommand);

program
  .command('run')
  .description('Execute a task by compiling its full context bundle')
  .argument('[task]', 'Task ID to execute (auto-selects next available if omitted)')
  .option('--agent <agent>', 'Override the assigned agent')
  .option('--dry-run', 'Preview the context bundle without executing')
  .option('--concurrent <n>', 'Number of parallel agent loops (v3 swarm mode)', parseInt)
  .option('--provider <provider>', 'LLM provider to use for native execution (openai, anthropic, ollama)')
  .option('--model <model>', 'LLM model to use with the selected provider')
  .option('--swarm <id>', 'Join the named networked swarm (v4 Pillar 1) and coordinate claims via a coordinator')
  .action((task, opts) => commands.runCommand(task, opts));

program
  .command('checkpoint')
  .description('Report a task status update from an agent (used in swarm mode)')
  .argument('<taskId>', 'The ID of the task to update')
  .argument('[status]', 'New status: done, blocked, in-progress, review, todo')
  .argument('[message]', 'Optional message to log to the runtime log')
  .option('--ask-human', 'Pause for human review: mark the task [ ?] and stop the loop')
  .action(commands.checkpointCommand);

program
  .command('serve')
  .description('Run the ALP State Server: a live dashboard for the swarm (v3 Pillar 4)')
  .option('--port <n>', 'Port to listen on (default 4000)', (v) => parseInt(v, 10))
  .option('--host <host>', 'Host to bind to (default 127.0.0.1)')
  .option('--db', 'Persist a durable state store of runtime events for analytics (v4 Pillar 5)')
  .option('--registry', 'Host the ALP package registry over HTTP (v4 Pillar 3)')
  .option('--registry-token <token>', 'Require this bearer token on all /api/registry requests (spec/14 §4.2)')
  .option('--registry-sign-key <file>', 'Ed25519 private key (PEM) to sign published versions on the host (v4.1)')
  .action((opts) => commands.serveCommand(opts));

program
  .command('evolve')
  .description('Analyze runtime telemetry and propose self-improvements (v3 Pillar 5)')
  .option('--apply', 'Write proposed rules to .alp/evolved.alp')
  .option('--from-pr <n>', 'Extract rules from a GitHub PR (requires provider)')
  .action((opts) => commands.evolveCommand(opts));

program
  .command('policy')
  .description('List or evaluate policy guardrails governing agent actions (v4; v2 in v8.1.0)')
  .option('--path <path>', 'Check whether a file path may be modified')
  .option('--command <cmd>', 'Check whether a shell command may be run')
  .option('--agent <agent>', 'Scope the check to a specific agent')
  .option('--proposal <id>', 'v8.1.0: verify a signed action proposal by id')
  .option('--trust <pem>', 'v8.1.0: trust root (ns=pem) for proposal verification')
  .action((opts) => commands.policyCommand(opts));

program
  .command('schedule')
  .description('List and evaluate @timeline schedules (v8.2.0)')
  .option('--next', 'Show only timelines that are due at the current time')
  .option('--enable <id>', 'Enable a disabled @timeline by id')
  .option('--disable <id>', 'Disable an enabled @timeline by id')
  .option('--at <iso>', 'Evaluate schedules as of a fixed ISO datetime (testing)')
  .action((opts) => commands.scheduleCommand(opts));

program
  .command('swarm')
  .description('Manage membership in a networked swarm (v4 Pillar 1)')
  .argument('[subcommand]', 'join | leave | roster (default roster)')
  .argument('[swarm]', 'Swarm id (first @swarm in the workspace if omitted)')
  .option('--coordinator <url>', 'Coordinator base URL (overrides @swarm coordinator)')
  .option('--token <token>', 'Bearer token for the coordinator')
  .option('--node <id>', 'This node id')
  .action((sub, swarm, opts) => commands.swarmCommand(sub, swarm, opts));

program
  .command('repo')
  .description('Cross-repository orchestration: discover, fetch, and resolve external repos (v4 Pillar 2)')
  .argument('[subcommand]', 'ls | fetch | resolve | graph (default resolve)')
  .option('--fetch', 'Fetch/update Git-backed repos before resolving')
  .action((sub, opts) => commands.repoCommand(sub, opts));

program
  .command('registry')
  .description('Hosted registry & marketplace: serve, publish, list, search, install (v4 Pillar 3)')
  .argument('[subcommand]', 'serve | publish | list | search | install | verify (default list)')
  .argument('[target]', 'Package dir (publish) or name[version] (install/search)')
  .option('--url <url>', 'Registry base URL (overrides ALP_REGISTRY_URL)')
  .option('--version <v>', 'Version for install')
  .option('--token <token>', 'Bearer token for the registry (overrides .alprc / ALP_REGISTRY_TOKEN)')
  .option('--key <file>', 'Trusted public key (PEM) — require + verify signed installs (v4.1)')
  .option('--sign-key <file>', 'Ed25519 private key (PEM) to sign published versions (v4.1)')
  .action((sub, target, opts) => commands.registryCommand(sub, target, opts));

program
  .command('install')
  .description('Install a community package from the ALP Registry')
  .argument('<package>', 'Name of the package to install (e.g. @community/scrum-master)')
  .option('--url <url>', 'Registry base URL (overrides ALP_REGISTRY_URL)')
  .option('--version <v>', 'Version to install (default latest)')
  .option('--key <file>', 'Trusted public key (PEM) — require + verify signed installs (v4.1)')
  .action((pkg, opts) => commands.installCommand(pkg, opts));

program
  .command('uninstall')
  .description('Uninstall a package from the ALP Registry')
  .argument('<package>', 'Name of the package to uninstall')
  .action(commands.uninstallCommand);

program
  .command('publish')
  .description('Publish a local package to the ALP Registry (v4 Pillar 3)')
  .argument('<directory>', 'Directory containing the package (must have alp-package.json)')
  .option('--url <url>', 'Publish to a remote registry host (alp serve --registry) instead of the local store')
  .option('--token <token>', 'Bearer token for the registry (overrides .alprc / ALP_REGISTRY_TOKEN)')
  .option('--sign-key <file>', 'Ed25519 private key (PEM) to sign the published version (v4.1 trust)')
  .action((dir, opts) => commands.publishCommand(dir, opts));

program
  .command('keys')
  .description('Manage registry package-signing keypairs & trust roots (v4.2/4.3)')
  .argument('[args...]', 'generate | fingerprint <file> | trust add <ns|*> <fingerprint|file> | trust list')
  .action((args: string[]) => commands.keysCommand(args[0], args.slice(1)));

program
  .command('test-harness')
  .description('Run the ALP compliance test suite against the bundled parser or an external one (v6.2.0)')
  .option('--executable <cmd>', 'External parser executable: takes a .alp path, prints AST JSON to stdout, non-zero on failure')
  .option('--suite <dir>', 'Path to the compliance suite directory (default ./tests/compliance)')
  .action((opts) => commands.testHarnessCommand(opts));

program
  .command('replay')
  .description('Replay the immutable event log of workspace mutations (v10.1.0 Event Sourcing)')
  .option('--from <iso>', 'Replay events at or after this ISO timestamp')
  .option('--to <iso>', 'Replay events at or before this ISO timestamp')
  .option('--type <types>', 'Comma-separated event types to include (e.g. status_changed,object_created)')
  .option('--object-id <id>', 'Only events whose payload references this object id')
  .action((opts) => commands.replayCommand(opts));

program
  .command('visualize')
  .description('Generate a diagram from @workflow objects (v10.2.0 Workflow Visualization)')
  .argument('[id]', 'Workflow id to visualize (all workflows if omitted)')
  .option('--format <format>', 'Output format: mermaid, dot, json (default mermaid)')
  .option('--out <file>', 'Write output to a file instead of stdout')
  .action((id, opts) => commands.visualizeCommand(id, opts));

program
  .command('export')
  .description('Export the ALP workspace to a unified JSON or YAML file')
  .option('--format <format>', 'Export format: json or yaml', 'json')
  .option('--out <file>', 'Output file path (prints to stdout if omitted)')
  .option('--minified', 'Minify JSON output (only applies to json format)')
  .action(commands.exportCommand);

program
  .command('backup')
  .description('Backup, restore, and list workspace snapshots')
  .argument('<action>', 'Action: create, restore, or list')
  .argument('[name]', 'Backup name for create/restore')
  .action((action, name) => commands.backupCommand(action, name));

program
  .command('diff')
  .description('Diff two workspace snapshots by object id')
  .argument('<snapshot-a>', 'Older snapshot name')
  .argument('<snapshot-b>', 'Newer snapshot name')
  .action((a, b) => commands.diffCommand(a, b));

program
  .command('rename')
  .description('Rename an ALP object id across all workspace files')
  .argument('<old-id>', 'Current object id')
  .argument('<new-id>', 'New object id')
  .action((oldId, newId) => commands.renameCommand(oldId, newId));

program
  .command('copy')
  .description('Copy an ALP object to a new id across all workspace files')
  .argument('<id>', 'Object id to copy')
  .argument('<new-id>', 'New object id')
  .option('--update-refs', 'Also update reference fields (depends_on, references, links, parent, child)')
  .action((id, newId, opts) => commands.copyCommand(id, newId, opts.updateRefs));

program
  .command('stats')
  .description('Show workspace statistics: object counts by type and file')
  .action(() => commands.statsCommand());

program
  .command('template')
  .description('Create a new ALP object from a built-in template')
  .argument('<type>', 'Template type: task, agent, workflow, policy, test')
  .argument('<id>', 'Object id for the new template')
  .action((type, id) => commands.templateCommand(type, id));

program
  .command('move')
  .description('Move an ALP object from one file to another')
  .argument('<id>', 'Object id to move')
  .argument('<target-file>', 'Target .alp file (e.g. tasks.alp)')
  .action((id, targetFile) => commands.moveCommand(id, targetFile));

program
  .command('depends')
  .description('Show dependencies for an ALP object')
  .argument('<id>', 'Object id to inspect')
  .action((id) => commands.dependsCommand(id));

program
  .command('inspect')
  .description('Inspect an ALP object and show its properties')
  .argument('<id>', 'Object id to inspect')
  .option('--file <path>', 'Optional specific file to inspect')
  .action((id, opts) => commands.inspectCommand(id, opts));

program
  .command('delete')
  .description('Delete an ALP object from a workspace file')
  .argument('<id>', 'Object id to delete')
  .option('--file <path>', 'Optional specific file to delete from')
  .action((id, opts) => commands.deleteCommand(id, opts));

program
  .command('archive')
  .description('Archive objects with a given status')
  .argument('<status>', 'Status to archive (e.g. done)')
  .action((status) => commands.archiveCommand(status));

program
  .command('deduplicate')
  .description('Remove duplicate objects across workspace files')
  .action(() => commands.deduplicateCommand());

program
  .command('promote')
  .description('Promote an object to a new type')
  .argument('<id>', 'Object id to promote')
  .argument('<type>', 'New type for the object')
  .action((id, type) => commands.promoteCommand(id, type));

program
  .command('cost')
  .description('Show token usage and compute cost for a task (v10.7.0 Resource Metering)')
  .argument('[task-id]', 'Task ID to inspect (defaults to latest metered task)')
  .option('--workflow <id>', 'Optimize a workflow and show cost savings (v16.0.0)')
  .action((taskId, opts) => commands.costCommand(taskId, opts));

program
  .command('debug')
  .description('Time-travel debug a run via snapshots (v10.8.0)')
  .argument('<run-id>', 'Run identifier')
  .option('--step <n>', 'Step forward (positive) or backward (negative) by N snapshots', parseInt)
  .option('--to-stage <name>', 'Jump to the snapshot matching this engine stage')
  .option('--diff <a> <b>', 'Diff two snapshot ids')
  .action((runId, opts) => commands.debugCommand(runId, opts));

program
  .command('bridge')
  .description('Export/import ALP workflows to/from OpenAPI, GraphQL, gRPC, or AsyncAPI (v17.0.0)')
  .argument('<format>', 'Target format: openapi, graphql, grpc, asyncapi')
  .argument('[file]', 'Import from a JSON spec file instead of exporting the local workflow')
  .action((format, file) => commands.bridgeCommand(format, file));

program
  .command('domain-trust')
  .description('Manage cross-domain trust relationships (v14)')
  .argument('<subcommand>', 'create-domain | link | accept | list | revoke')
  .argument('[args...]', 'Subcommand arguments')
  .action((subcommand, args) => commands.domainTrustCommand(subcommand, ...args));

program
  .command('governance')
  .description('Autonomous governance ballots (v14)')
  .argument('<subcommand>', 'propose | vote | close | list')
  .argument('[args...]', 'Subcommand arguments')
  .action((subcommand, args) => commands.governanceCommand(subcommand, ...args));

program
  .command('tenant')
  .description('Multi-tenant isolation (v14)')
  .argument('<subcommand>', 'create | list | vault | delete')
  .argument('[args...]', 'Subcommand arguments')
  .action((subcommand, args) => commands.tenantCommand(subcommand, ...args));

program
  .command('healing')
  .description('Self-healing workflow history (v12)')
  .argument('<subcommand>', 'history | report')
  .argument('[args...]', 'Subcommand arguments')
  .action((subcommand, args) => commands.healingCommand(subcommand, ...args));

program
  .command('resilience')
  .description('Swarm resilience and agent status (v12)')
  .argument('<subcommand>', 'agents | report')
  .argument('[args...]', 'Subcommand arguments')
  .action((subcommand, args) => commands.resilienceCommand(subcommand, ...args));

program
  .command('tui')
  .description('Launch the interactive terminal UI dashboard (v16.0.0)')
  .action(commands.tuiCommand);

program
  .command('settings')
  .description('Read and write workspace settings (v41.0.0 IDE Productivity)')
  .option('--list', 'List all settings')
  .option('--get <key>', 'Get a specific setting value')
  .option('--set <key> <value>', 'Set a setting value')
  .action((opts) => commands.settingsCommand(opts));

program
  .command('search')
  .description('Global workspace search with regex and file-type filters (v41.0.0)')
  .option('--query <text>', 'Search query text')
  .option('--type <type>', 'Filter by object type (e.g. task, agent)')
  .option('--regex', 'Treat query as a regular expression')
  .action((opts) => commands.searchCommand(opts));

program
  .command('git')
  .description('Built-in git status, diff, and commit panel (v41.0.0)')
  .option('--status', 'Show git status (default)')
  .option('--diff', 'Show git diff summary')
  .option('--commit <message>', 'Stage all changes and commit')
  .action((opts) => commands.gitCommand(opts));

// ── Feature: Synapse Knowledge Graph & Canvas Vault ───────────────────
const synapse = program
  .command('synapse')
  .description('Synapse Knowledge Graph, Canvas Vault & Topology visualizer (v80.0.0)');

synapse
  .command('export')
  .description('Export ALP workspace as a Synapse Markdown vault with wikilinks and canvas')
  .option('--out <dir>', 'Output directory (default: .synapse)')
  .option('--canvas', 'Include visual .canvas diagram file')
  .action((opts) => commands.synapseExportCommand(opts));

synapse
  .command('graph')
  .description('Generate knowledge graph topology representation')
  .option('--format <fmt>', 'Graph format: json, dot, mermaid, canvas', 'json')
  .option('--out <file>', 'Output destination file path')
  .action((opts) => commands.synapseGraphCommand(opts));

synapse
  .command('stats')
  .description('Display knowledge graph connectivity, density, and hub metrics')
  .action(() => commands.synapseStatsCommand());

commands.registerTraceCommand(program);
commands.registerZKCommand(program);
commands.registerVectorCommand(program);
commands.registerDIDCommand(program);
commands.registerCRDTSyncCommand(program);
commands.registerHealCommand(program);
commands.registerFormalVerifyCommand(program);
commands.registerReasonCommand(program);

// ── Feature: Multi-Modal Protocol & VLA Commands (v82.0.0) ─────────────
const multimodal = program
  .command('multimodal')
  .description('Multi-Modal Protocol & Vision-Language-Action (VLA) Inspector (v82.0.0)');

multimodal
  .command('inspect')
  .description('Inspect vision, audio, and sensor assets in .alp workspace')
  .option('--json', 'Output results as JSON')
  .action((opts) => commands.multimodalInspectCommand(opts));

multimodal
  .command('validate')
  .description('Validate multimodal specification integrity and asset hashes')
  .action(() => commands.multimodalValidateCommand());

program
  .command('action-space')
  .description('Check action space safety levels and guard constraints (v82.0.0)')
  .command('check')
  .description('Check all action spaces or a specific one by id')
  .argument('[id]', 'Action space id')
  .action((id) => commands.actionSpaceCheckCommand(id));

program
  .command('token-cost')
  .description('Estimate token costs for multimodal assets and vision models (v82.0.0)')
  .option('--modalities <list>', 'Comma-separated modalities (vision,audio,sensor,text,spatial)')
  .option('--json', 'Output results as JSON')
  .action((opts) => commands.tokenCostCommand(opts));

// ── Feature: Code Generation (PHP / C++) ───────────────────────────────
program
  .command('codegen')
  .description('Generate PHP 8 / C++17 source code from ALP workspace objects (v82.0.0)')
  .requiredOption('--target <t>', 'Target language: php or cpp')
  .option('--namespace <ns>', 'Target namespace (default: Alp\\Generated for php, alp for cpp)')
  .option('--out <dir>', 'Output directory (default: alp-codegen/<target>)')
  .action((opts) => commands.codegenCommand(opts));

program.parse(process.argv);

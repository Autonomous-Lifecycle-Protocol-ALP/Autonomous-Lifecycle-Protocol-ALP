import { useState } from "react";

const DOC_SECTIONS = [
  { id: "overview", label: "What is ALP?" },
  { id: "how-it-works", label: "How It Works" },
  { id: "ecosystem", label: "Ecosystem & Tools" },
  { id: "cli", label: "CLI Guide" },
  { id: "sdk", label: "SDKs" },
  { id: "tutorial", label: "Tutorial" },
  { id: "spec", label: "Specification" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">ALP v80.0.0</h1>
            <p className="lead text-gray-400">The Autonomous Lifecycle Protocol</p>

            <blockquote className="border-l-4 border-sky-500 pl-4 italic text-gray-300">
              Git standardized version control. Docker standardized environments. OpenAPI standardized APIs. ALP standardizes how AI builds software.
            </blockquote>

            <p>
              The open standard & high-performance execution engine for AI-driven software engineering. Write a machine-readable spec — let your agents plan, build, verify, and remember.
            </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="text-center p-4 border border-gray-700 rounded-lg glass-dark">
            <div className="text-2xl font-bold text-gray-100">49</div>
            <div className="text-xs text-gray-500">JSON Schemas</div>
          </div>
          <div className="text-center p-4 border border-gray-700 rounded-lg glass-dark">
            <div className="text-2xl font-bold text-gray-100">80.0.0</div>
            <div className="text-xs text-gray-500">Toolchain Release</div>
          </div>
          <div className="text-center p-4 border border-gray-700 rounded-lg glass-dark">
            <div className="text-2xl font-bold text-gray-100">1013+</div>
            <div className="text-xs text-gray-500">Passed Tests</div>
          </div>
          <div className="text-center p-4 border border-gray-700 rounded-lg glass-dark">
            <div className="text-2xl font-bold text-gray-100">1:5</div>
            <div className="text-xs text-gray-500">Language SDK Parity</div>
          </div>
        </div>
      </div>
    );

      case "how-it-works":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">How ALP Works</h1>
            <p>ALP turns your repository into a deterministic, machine-readable project specification that any AI agent can read, understand, and act on.</p>

            <h2 className="text-gray-100">The ALP Workflow</h2>
            <ol>
              <li><strong>Write</strong> — Define your project in <code>.alp/</code> files using the ALP protocol</li>
              <li><strong>Parse</strong> — The parser builds a dependency graph and validates against 49 JSON schemas</li>
              <li><strong>Execute</strong> — The engine topologically sorts tasks and compiles context bundles in &lt; 2ms</li>
              <li><strong>Verify</strong> — Quality gates ensure tasks aren't marked done until tests pass</li>
              <li><strong>Remember</strong> — Cross-session memory eliminates redundant context scraping</li>
            </ol>

            <h3 className="text-gray-100">ALP File Syntax</h3>
            <pre className="bg-gray-800/40 text-gray-300 p-4 rounded-lg overflow-x-auto"><code>{`!alp-version: 80.0.0

@project
  id: my-project
  name: My Project
  version: 1.0.0
  state: active

@feature
  id: feat-auth
  name: Authentication
  description: OAuth2 + JWT authentication flow

@task
  id: task-login-ui
  name: Build login UI
  status: [ ]
  depends_on:
    - task-setup-db
  verify:
    - npm run test:login
    - npm run lint:login

@agent
  id: agent-frontend
  name: Frontend Specialist
  capabilities: [react, typescript, tailwind]`}</code></pre>

            <h3 className="text-gray-100">CLI Commands</h3>
            <ul>
              <li><code>alp init</code> — Initialize a new ALP workspace</li>
              <li><code>alp validate</code> — Validate your <code>.alp/</code> files against schemas</li>
              <li><code>alp run</code> — Execute the next available task with an AI agent</li>
              <li><code>alp verify &lt;task-id&gt;</code> — Run quality gate scripts</li>
              <li><code>alp status</code> — Show project progress</li>
            </ul>
          </div>
        );

      case "ecosystem":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">ALP Ecosystem & Tools</h1>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">@alp/cli</h3>
                <p className="text-sm text-gray-400">Terminal CLI: <code>run</code>, <code>validate</code>, <code>verify</code>, <code>status</code>, <code>serve</code>, <code>marketplace</code>, <code>vault</code>, <code>policy</code></p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">@alp/parser</h3>
                <p className="text-sm text-gray-400">Parses <code>.alp</code> files, builds dependency graph using Kahn topological sort in &lt; 2ms</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">@alp/mcp-server</h3>
                <p className="text-sm text-gray-400">MCP integration for Claude Desktop, Cursor — tools like <code>alp_get_graph</code></p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">VS Code Extension</h3>
                <p className="text-sm text-gray-400">Language server with IntelliSense, go-to-definition, DAG visualization</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">TypeScript SDK</h3>
                <p className="text-sm text-gray-400">Full API: parsing, AST validation, DAG, event mesh, collaboration</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">Python SDK</h3>
                <p className="text-sm text-gray-400">Parsing, verification gates, analytics, DID identity, P2P swarm</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">Go SDK</h3>
                <p className="text-sm text-gray-400">High-performance DAG resolution, pub/sub event mesh, governance voting</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">Rust SDK</h3>
                <p className="text-sm text-gray-400">Async Tokio engine, DID, vault, policy</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">Java SDK</h3>
                <p className="text-sm text-gray-400">JVM integration, Jackson mapping, thread-safe governance</p>
              </div>
              <div className="border border-gray-700 rounded-lg p-4 glass-dark">
                <h3 className="text-gray-100">SHAM IDE (v81)</h3>
                <p className="text-sm text-gray-400">Cross-platform desktop IDE — Mac/Windows/Linux with native ALP, Monaco, agent manager</p>
              </div>
            </div>
          </div>
        );

      case "cli":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">ALP CLI Usage Guide</h1>

            <h2 className="text-gray-100">Installation</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>npm install -g @autonomous-lifecycle-protocol-alp/cli</code></pre>

            <h2 className="text-gray-100">Quick Start</h2>
            <h3 className="text-gray-100">1. Initialization</h3>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>alp init</code></pre>
            <p>Creates an <code>.alp/</code> directory with starter <code>project.alp</code>, <code>agents.alp</code>, and <code>memory.alp</code>.</p>

            <h3>2. Defining Features and Tasks</h3>
            <pre className="bg-gray-800/40 text-gray-300 p-4 rounded overflow-x-auto"><code>{`!alp-version: 80.0.0

@feature
  id: feat-auth
  status: [~]
  description: "User authentication system"

@task
  id: task-login-ui
  status: [ ]
  feature: -> feat-auth
  priority: high`}</code></pre>

            <h3 className="text-gray-100">3. Validation</h3>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>alp validate</code></pre>
            <p>Ensures your <code>.alp/</code> files conform to the 49 JSON Schemas of the protocol.</p>

            <h3 className="text-gray-100">4. Progress Tracking</h3>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>alp status</code></pre>

            <h2 className="text-gray-100">Execution Engine</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>{`alp run                  # Auto-select next task
alp run --concurrent 3     # Run 3 agents in parallel (V3 swarm)
alp run --provider openai  # Specify LLM provider
alp run --dry-run          # Preview context bundle`}</code></pre>

            <h2 className="text-gray-100">Verification</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>{`# Define quality gates in .alp files
@task
  id: task-auth
  verify:
    - "npm run test:auth"
    - "eslint src/auth/"

# Run verification
alp verify task-auth`}</code></pre>

            <h2 className="text-gray-100">Live State Dashboard</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>alp serve</code></pre>
            <p>Runs a zero-dependency local dashboard visualizing your swarm in real-time over Server-Sent Events.</p>

            <h2 className="text-gray-100">Full Command Reference</h2>
            <table className="w-full text-sm">
              <thead><tr><th className="text-left pb-2 border-b">Command</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td className="py-1"><code>alp run</code></td><td>Execute next available task with AI agent</td></tr>
                <tr><td className="py-1"><code>alp verify</code></td><td>Run quality gate scripts for a task</td></tr>
                <tr><td className="py-1"><code>alp validate</code></td><td>Validate .alp/ files against schemas</td></tr>
                <tr><td className="py-1"><code>alp status</code></td><td>Show project progress and task status</td></tr>
                <tr><td className="py-1"><code>alp init</code></td><td>Create .alp/ directory structure</td></tr>
                <tr><td className="py-1"><code>alp checkpoint</code></td><td>Submit task for human review (HITL)</td></tr>
                <tr><td className="py-1"><code>alp serve</code></td><td>Start local real-time dashboard</td></tr>
                <tr><td className="py-1"><code>alp marketplace</code></td><td>Browse and install swarm skills</td></tr>
                <tr><td className="py-1"><code>alp vault</code></td><td>Manage encrypted secrets (X25519)</td></tr>
                <tr><td className="py-1"><code>alp policy</code></td><td>Configure UTC policy rules</td></tr>
              </tbody>
            </table>
          </div>
        );

      case "sdk":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">ALP SDKs</h1>
            <p>Official SDK packages for integrating ALP into multi-language applications and autonomous agent systems.</p>

            <h2 className="text-gray-100">Available SDK Matrix</h2>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left pb-2 border-b">Language</th>
                  <th className="text-left pb-2 border-b">Package</th>
                  <th className="pb-2 border-b">Version</th>
                  <th className="text-left pb-2 border-b">Primary Capabilities</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1">TypeScript</td><td><code>@alp/sdk</code></td><td>80.0.0</td><td>Parsing, DAG, Event Mesh, Collaboration</td></tr>
                <tr><td className="py-1">Python</td><td><code>alp-sdk</code></td><td>80.0.0</td><td>Parsing, verification, analytics, DID, P2P swarm</td></tr>
                <tr><td className="py-1">Go</td><td><code>alp-go</code></td><td>0.46.0</td><td>DAG resolution, pub/sub, governance voting</td></tr>
                <tr><td className="py-1">Rust</td><td><code>alp-rs</code></td><td>0.46.0</td><td>Tokio engine, DID, vault, policy</td></tr>
                <tr><td className="py-1">Java</td><td><code>alp-java</code></td><td>46.0.0</td><td>JVM integration, Jackson, thread-safe governance</td></tr>
              </tbody>
            </table>

            <h2 className="text-gray-100">Python SDK Example</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-4 rounded overflow-x-auto"><code>{`from alp_sdk import Workspace

# Load workspace and parse .alp definitions
ws = Workspace.load("./my-project")

# Compute DAG and resolve task ordering
graph = ws.get_graph()
order = graph.topological_sort()

for task in order:
    print(f"Task: {task.name} (status: {task.status})")

# Run the agent on the next available task
ws.run_next()`}</code></pre>

            <h2 className="text-gray-100">TypeScript SDK Example</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-4 rounded overflow-x-auto"><code>{`import { Workspace } from '@alp/sdk';

const ws = new Workspace('./my-project');
await ws.load();

const graph = ws.getGraph();
const order = graph.topologicalSort();

for (const task of order) {
  console.log(\`Task: \${task.name} (status: \${task.status})\`);
}`}</code></pre>
          </div>
        );

      case "tutorial":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">ALP Tutorial</h1>
            <p>A hands-on guide to building your first ALP project from scratch.</p>

            <h2 className="text-gray-100">Prerequisites</h2>
            <ul>
              <li>Node.js 24+ and npm 10+</li>
              <li>A code editor (VS Code recommended with the ALP extension)</li>
              <li>Basic familiarity with command-line tools</li>
            </ul>

            <h2 className="text-gray-100">Step 1: Initialize Your Project</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>{`mkdir my-alp-project
cd my-alp-project
git init
alp init`}</code></pre>
            <p>Creates:</p>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>{`my-alp-project/
├── .alp/
│   ├── project.alp
│   ├── agents.alp
│   └── memory.alp
├── src/
└── README.md`}</code></pre>

            <h2 className="text-gray-100">Step 2: Configure Your Project</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-4 rounded overflow-x-auto"><code>{`!alp-version: 80.0.0

@project
  id: my-alp-project
  name: My ALP Project
  version: 1.0.0
  state: active
  description: A sample ALP project`}</code></pre>

            <h2 className="text-gray-100">Step 3: Define Features & Tasks</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-4 rounded overflow-x-auto"><code>{`@feature
  id: feat-auth
  name: User Authentication
  status: [~]

@task
  id: task-login-ui
  name: Build login UI
  status: [ ]
  agent: agent-frontend
  depends_on: task-setup-db
  verify:
    - npm run test:login
    - npm run lint:login`}</code></pre>

            <h2 className="text-gray-100">Step 4: Validate and Execute</h2>
            <pre className="bg-gray-800/40 text-gray-300 p-3 rounded"><code>{`# Validate your workspace
alp validate

# Execute the next available task
alp run

# Verify quality gates
alp verify task-login-ui`}</code></pre>
          </div>
        );

      case "spec":
        return (
          <div className="prose max-w-none text-gray-300">
            <h1 className="text-gray-100">ALP Specification</h1>
            <p><strong>Version:</strong> 80.0.0 — <strong className="text-gray-400">Status:</strong> Stable</p>

            <h2 className="text-gray-100">1. What Is ALP?</h2>
            <p>ALP (Autonomous Lifecycle Protocol) is the world's first open protocol specifically designed for autonomous software engineering. It replaces unstructured project documentation with a deterministic, machine-readable specification.</p>

            <h2 className="text-gray-100">2. ALP Syntax Elements</h2>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left pb-2 border-b">Element</th>
                  <th className="text-left pb-2 border-b">Syntax</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1"><code>@project</code></td><td className="py-1">Top-level</td><td className="py-1">Project metadata and configuration</td></tr>
                <tr><td className="py-1"><code>@feature</code></td><td className="py-1">Top-level</td><td className="py-1">A feature with status tracking</td></tr>
                <tr><td className="py-1"><code>@task</code></td><td className="py-1">Top-level</td><td className="py-1">A unit of work with dependencies and verification</td></tr>
                <tr><td className="py-1"><code>@agent</code></td><td className="py-1">Top-level</td><td className="py-1">Agent definition with capabilities</td></tr>
                <tr><td className="py-1"><code>@memory</code></td><td className="py-1">Top-level</td><td className="py-1">Persistent memory for cross-session context</td></tr>
                <tr><td className="py-1"><code>@contract</code></td><td className="py-1">Top-level</td><td className="py-1">API boundary enforcement rules</td></tr>
                <tr><td className="py-1"><code>@policy</code></td><td className="py-1">Top-level</td><td className="py-1">UTC governance and compliance policies</td></tr>
                <tr><td className="py-1"><code>@vault</code></td><td className="py-1">Top-level</td><td className="py-1">Encrypted secret management</td></tr>
              </tbody>
            </table>

            <h2 className="text-gray-100">3. Status Markers</h2>
            <table className="w-full text-sm">
              <thead>
                <tr><th className="text-left pb-2 border-b">Marker</th><th>Since</th><th>Meaning</th></tr>
              </thead>
              <tbody>
                <tr><td className="py-1"><code>[ ]</code></td><td className="py-1">v1.0</td><td className="py-1">Pending / not started</td></tr>
                <tr><td className="py-1"><code>[~]</code></td><td className="py-1">v1.0</td><td className="py-1">In progress</td></tr>
                <tr><td className="py-1"><code>[x]</code></td><td className="py-1">v1.0</td><td className="py-1">Completed / done</td></tr>
                <tr><td className="py-1"><code>[!]</code></td><td className="py-1">v9.0</td><td className="py-1">Blocked — requires reason text</td></tr>
                <tr><td className="py-1"><code>[?]</code></td><td className="py-1">v9.0</td><td className="py-1">Needs review — requires reason text</td></tr>
              </tbody>
            </table>

            <h2 className="text-gray-100">4. Specification Sections</h2>
            <ol>
              <li><strong>Overview</strong> — What is ALP, why it exists, core elements</li>
              <li><strong>Syntax</strong> — The <code>.alp</code> file format and grammar</li>
              <li><strong>Protocol Objects</strong> — Project, feature, task, agent, memory</li>
              <li><strong>Lifecycle</strong> — State transitions and status semantics</li>
              <li><strong>Engines</strong> — Parser, execution engine, verification engine</li>
              <li><strong>Memory Model</strong> — Cross-session memory persistence</li>
              <li><strong>Dependency Graph</strong> — Kahn topological sorting</li>
              <li><strong>Agent Model</strong> — Multi-agent orchestration</li>
              <li><strong>Directory Structure</strong> — <code>.alp/</code> file layout</li>
              <li><strong>Versioning</strong> — Semantic versioning guarantees</li>
              <li><strong>Plugins</strong> — Extensibility system</li>
              <li><strong>Expressions (ALPEL)</strong> — Expression language</li>
              <li><strong>Multi-Project</strong> — Monorepo support</li>
              <li><strong>Plugin Registry</strong> — Skill marketplace</li>
              <li><strong>Formal Grammar</strong> — EBNF definition</li>
              <li><strong>Compliance</strong> — SOC2/ISO27001 requirements</li>
              <li><strong>Scheduling</strong> — Task scheduling and orchestration</li>
              <li><strong>Contracts</strong> — API boundary enforcement</li>
              <li><strong>Encrypted Vault</strong> — Secret management</li>
              <li><strong>Event Sourcing</strong> — DAG state event logs</li>
              <li><strong>Workflow Visualization</strong> — DAG visualization</li>
              <li><strong>Swarm Marketplace</strong> — Agent skill marketplace</li>
            </ol>
          </div>
        );

      default:
        return <div className="text-center py-12 text-gray-400">Select a documentation section</div>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-100">ALP Documentation</h1>
      <div className="bg-gray-800/40 text-xs text-gray-400 px-3 py-1 rounded">
        Open-source protocol docs integrated into ALP Enterprise dashboard
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="glass-dark rounded-lg shadow border border-gray-700">
            <div className="bg-gray-800/50 px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
              Contents
            </div>
            <nav className="py-1">
              {DOC_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-sky-900/30 text-sky-300 border-l-2 border-sky-500 font-medium"
                      : "text-gray-400 hover:bg-gray-800/30"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 glass-dark rounded-lg shadow border border-gray-700 p-6 overflow-y-auto">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

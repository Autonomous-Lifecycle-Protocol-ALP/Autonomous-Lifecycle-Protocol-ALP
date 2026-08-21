export const TEMPLATES: Record<string, { label: string; code: string }> = {
  webApp: {
    label: 'Web App Lifecycle',
    code: `!alp-version: 3.0.0

@project
  id: alp-commerce-app
  status: [~]
  description: "Next-gen Autonomous E-Commerce Platform"

@feature
  id: feat-auth
  status: [x]
  description: "User Authentication & OAuth2"

@feature
  id: feat-checkout
  status: [~]
  description: "Stripe & Crypto Payment Gateway"

@task
  id: task-db-schema
  status: [x]
  feature: -> feat-auth
  owner: "@agent-backend"
  verify:
    - "npm run db:migrate"

@task
  id: task-auth-api
  status: [x]
  feature: -> feat-auth
  depends_on:
    - -> task-db-schema
  verify:
    - "npm test tests/auth.test.ts"

@task
  id: task-cart-api
  status: [~]
  feature: -> feat-checkout
  depends_on:
    - -> task-auth-api
  verify:
    - "npm test tests/cart.test.ts"

@task
  id: task-stripe-integration
  status: [!] Stripe key not configured
  feature: -> feat-checkout
  depends_on:
    - -> task-cart-api
  requires:
    - "env.STRIPE_SECRET_KEY != ''"
  verify:
    - "npm test tests/stripe.test.ts"

@rule
  id: rule-no-direct-db-write
  description: "All DB updates must pass through the repository pattern"
`,
  },
  swarm: {
    label: 'Swarm & Multi-Agent Network',
    code: `!alp-version: 3.0.0

@project
  id: autonomous-swarm-cluster
  status: [~]

@agent
  id: agent-architect
  role: "Lead Systems Architect"

@agent
  id: agent-coder
  role: "Senior Fullstack Engineer"

@agent
  id: agent-qa
  role: "Automated QA & Security Audit"

@task
  id: task-spec-decomposition
  status: [x]
  owner: -> agent-architect

@task
  id: task-build-core
  status: [~]
  depends_on:
    - -> task-spec-decomposition
  owner: -> agent-coder

@task
  id: task-run-fuzzing
  status: [ ]
  depends_on:
    - -> task-build-core
  owner: -> agent-qa
`,
  },
  governance: {
    label: 'Policy & Vault Governance',
    code: `!alp-version: 3.0.0

@project
  id: secure-banking-service
  status: [~]

@policy
  id: policy-prod-deploy
  applies_to: "@agent-deployer"
  allow_paths:
    - "deploy/**"
  deny_paths:
    - "secrets/**"
  require_approval: true

@contract
  id: contract-deploy-boundary
  from: "@agent-deployer"
  to: "@agent-k8s"
  allows:
    - "deploy.k8s.*"
  denies:
    - "admin.system.*"

@timeline
  id: tl-nightly-health
  cron: "0 1 * * *"
  description: "Nightly cluster health check"
  status: [ ]

@vault
  id: vault-prod-db
  recipients:
    - "maintainer.pub"

@task
  id: task-deploy-service
  status: [?] Awaiting production approval
  policy: -> policy-prod-deploy
  contract: -> contract-deploy-boundary
  vault: -> vault-prod-db
`,
  },
  eventMesh: {
    label: 'Event Mesh & CRDT State',
    code: `!alp-version: 3.0.0

@project
  id: real-time-crdt-sync
  status: [~]

@agent
  id: agent-node-alpha
  role: "P2P State Synchronizer Alpha"

@agent
  id: agent-node-beta
  role: "P2P State Synchronizer Beta"

@task
  id: task-init-crdt-canvas
  status: [x]
  owner: -> agent-node-alpha

@task
  id: task-broadcast-delta
  status: [~]
  depends_on:
    - -> task-init-crdt-canvas
  owner: -> agent-node-beta

@task
  id: task-reconcile-conflicts
  status: [ ]
  depends_on:
    - -> task-broadcast-delta
  owner: -> agent-node-alpha
`,
  },
  zkProof: {
    label: 'ZK-Proof & Formal Verification',
    code: `!alp-version: 3.0.0

@project
  id: zero-knowledge-verifier
  status: [~]

@task
  id: task-compile-circom-circuit
  status: [x]
  verify:
    - "npx circom circuit.circom --r1cs --wasm"

@task
  id: task-generate-witness
  status: [x]
  depends_on:
    - -> task-compile-circom-circuit
  verify:
    - "node generate_witness.js"

@task
  id: task-prove-zk-snark
  status: [~]
  depends_on:
    - -> task-generate-witness
  verify:
    - "npx snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json"

@task
  id: task-verify-on-chain
  status: [ ]
  depends_on:
    - -> task-prove-zk-snark
  verify:
    - "npx hardhat test test/verifier.test.ts"
`,
  },
  dataPipeline: {
    label: 'Autonomous Data Pipeline ETL',
    code: `!alp-version: 3.0.0

@project
  id: alp-analytics-etl
  status: [~]
  description: "Distributed telemetry ETL and analytics ingestion"

@agent
  id: agent-data-engineer
  role: "Data Pipeline Orchestrator"

@workflow
  id: wf-daily-aggregation
  schedule: "0 2 * * *"
  status: [~]

@task
  id: task-extract-logs
  status: [x]
  owner: -> agent-data-engineer
  verify:
    - "python -m etl.extract --source=s3"

@task
  id: task-transform-parquet
  status: [~]
  depends_on:
    - -> task-extract-logs
  owner: -> agent-data-engineer
  verify:
    - "python -m etl.transform --format=parquet"

@task
  id: task-load-clickhouse
  status: [ ]
  depends_on:
    - -> task-transform-parquet
  owner: -> agent-data-engineer
  verify:
    - "python -m etl.load --target=clickhouse"
`,
  },
  bftConsensus: {
    label: 'BFT Consensus & Settlement Mesh',
    code: `!alp-version: 3.0.0

@project
  id: bft-governed-ledger
  status: [~]

@swarm
  id: swarm-validator-ring
  topology: mesh
  consensus: pbft
  threshold: 0.67

@agent
  id: agent-validator-01
  role: "BFT Consensus Validator 1"

@agent
  id: agent-validator-02
  role: "BFT Consensus Validator 2"

@task
  id: task-propose-block
  status: [x]
  owner: -> agent-validator-01

@task
  id: task-gather-signatures
  status: [~]
  depends_on:
    - -> task-propose-block
  owner: -> agent-validator-02

@task
  id: task-settle-epoch
  status: [ ]
  depends_on:
    - -> task-gather-signatures
`,
  },
  aiCopilot: {
    label: 'Multi-Agent Reasoning & Copilot',
    code: `!alp-version: 3.0.0

@project
  id: intelligent-code-copilot
  status: [~]

@agent
  id: agent-reasoner
  role: "Chain-of-Thought Reasoning Model"

@agent
  id: agent-executor
  role: "Sandboxed Code Execution Engine"

@memory
  id: mem-project-context
  type: semantic-vector
  scope: workspace

@task
  id: task-analyze-codebase
  status: [x]
  owner: -> agent-reasoner

@task
  id: task-synthesize-patch
  status: [~]
  depends_on:
    - -> task-analyze-codebase
  owner: -> agent-reasoner

@task
  id: task-sandbox-eval
  status: [ ]
  depends_on:
    - -> task-synthesize-patch
  owner: -> agent-executor
  verify:
    - "npm test --run"
`,
  },
  multimodal: {
    label: 'Multi-Modal & VLA Action Space',
    code: `!alp-version: 3.0.0

@project
  id: multimodal-vision-vla
  status: [~]
  description: "Vision-Language-Action Protocol & Sensor Stream Engine"

@agent
  id: agent-vla-controller
  role: "Embodied Vision-Language-Action Agent"

@multimodal
  id: mm-vision-pipeline
  modalities:
    - vision
    - text
    - sensor
  resolution: "1920x1080"
  fps: 30
  embedding_dim: 768
  assets:
    - id: asset-ui-screenshot
      type: image
      uri: "file://assets/screenshots/ui-main.png"
      format: png
    - id: asset-live-cam
      type: video
      uri: "rtsp://camera.local/live"
      format: h264

@vision_model
  id: model-siglip-base
  backbone: siglip
  context_tokens: 4096
  embedding_dim: 768
  latency_p95_ms: 45

@action_space
  id: act-browser-nav
  agent: agent-vla-controller
  domain: browser
  max_concurrency: 4
  actions:
    - name: click_element
      type: digital
      safety_level: low
    - name: submit_transaction
      type: api
      safety_level: critical
      requires_confirmation: true

@task
  id: task-capture-multimodal-frame
  status: [x]
  owner: -> agent-vla-controller

@task
  id: task-vla-action-dispatch
  status: [~]
  depends_on:
    - -> task-capture-multimodal-frame
  owner: -> agent-vla-controller
`,
  },
};

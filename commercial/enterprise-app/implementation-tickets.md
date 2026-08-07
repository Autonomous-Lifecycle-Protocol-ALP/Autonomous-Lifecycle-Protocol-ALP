# ALP Product Implementation Tickets

Tickets are grouped by target quarter. Each ticket is sized for a single engineer or small pair and includes acceptance criteria.

---

## Q3 2026 — ALP Cloud Workspace (Beta)

**Epic:** Deliver a hosted, collaborative ALP workspace in the browser with real-time editing, RBAC, and snapshot/rollback.

### CW-1 Workspace bootstrap service

**Priority:** P0  
**Estimate:** 3 days

Create the backend service that provisions isolated workspace containers on demand.

**Scope:**
- `POST /api/cloud/workspaces` creates a workspace record and returns a workspace ID
- Docker runtime integration: one container per workspace using the existing Node.js base image
- Persist workspace metadata in MongoDB (`workspaces` collection reuse + `cloudWorkspaceId`)
- Health-check endpoint: `GET /api/cloud/workspaces/:id/health`

**Acceptance criteria:**
- Creating a workspace returns 201 with `{ id, name, status, createdAt }`
- Unauthenticated requests return 401
- Workspace container responds to HTTP health checks within 5s
- Failed container creation cleans up partial records

**Dependencies:** `commercial/alp-server` running, Docker daemon available

---

### CW-2 Browser-based Monaco editor shell

**Priority:** P0  
**Estimate:** 2 days

Add a new route and page in the enterprise app for the cloud workspace IDE.

**Scope:**
- Route: `/workspaces/:id/cloud` in the enterprise app
- Monaco editor loaded via `@monaco-editor/react`
- File tree loaded from `GET /api/ide/workspace/:id/files`
- Save path: `POST /api/ide/workspace/:id/file` (existing endpoint)

**Acceptance criteria:**
- User can open a workspace, see files, edit, and save
- File tree expands/collapses correctly
- Loading and error states visible

**Dependencies:** CW-1, existing `/api/ide/*` routes

---

### CW-3 Snapshot and rollback

**Priority:** P1  
**Estimate:** 2 days

Add snapshot creation and rollback for workspace state.

**Scope:**
- `POST /api/cloud/workspaces/:id/snapshots`
- `GET /api/cloud/workspaces/:id/snapshots`
- `POST /api/cloud/workspaces/:id/snapshots/:snapshotId/rollback`
- Snapshots stored as tar.gz in S3-compatible storage or local disk fallback

**Acceptance criteria:**
- Creating a snapshot returns a snapshot record with timestamp and size
- Rollback restores the workspace files to the captured state
- Failed rollback leaves current state intact

**Dependencies:** CW-1

---

### CW-4 RBAC and team workspaces

**Priority:** P1  
**Estimate:** 3 days

Extend auth and organization models to support workspace-level roles.

**Scope:**
- Add `workspaceMembers` collection with roles: `owner`, `editor`, `viewer`
- Middleware: `requireWorkspaceRole(['owner','editor'])`
- UI: workspace sharing modal with email invite

**Acceptance criteria:**
- Owner can invite members by email
- Viewer cannot write files; editor can
- Removing a member revokes access immediately

**Dependencies:** CW-1, existing auth middleware

---

### CW-5 Real-time collaboration via Yjs

**Priority:** P2  
**Estimate:** 3 days

Add Yjs CRDT sync over WebSocket for concurrent editing.

**Scope:**
- Socket.IO room per workspace
- Yjs doc bound to Monaco model
- Presence cursors via `y-protocols/awareness`

**Acceptance criteria:**
- Two users editing the same file see each other's changes within 200ms
- Offline edits merge without conflicts on reconnect
- Presence shows colored cursors with user names

**Dependencies:** CW-2, Socket.IO server

---

## Q4 2026 — ALP Agent Studio (Alpha)

**Epic:** Visual low-code agent designer with DAG builder, model routing, and simulation sandbox.

### AS-1 DAG designer with React Flow

**Priority:** P0  
**Estimate:** 4 days

Build the visual workflow designer page.

**Scope:**
- Route: `/agent-studio` in enterprise app
- React Flow canvas with custom agent/task nodes
- Sidebar palette of draggable node types: `agent`, `task`, `policy`, `contract`
- Save/load workflow as JSON via `POST /api/agent-studio/workflows`

**Acceptance criteria:**
- User can drag 5+ nodes, connect them, and save
- Saved workflow reloads with positions and edges intact
- Invalid connections (e.g., policy → agent without edge type) are blocked

**Dependencies:** Enterprise app routing, React Flow

---

### AS-2 Agent capability marketplace integration

**Priority:** P0  
**Estimate:** 2 days

Allow users to browse and insert marketplace capabilities into their DAG.

**Scope:**
- Fetch capabilities from `GET /api/platform/capabilities` (or existing marketplace API)
- Palette grouped by category: `coding`, `security`, `data`, `iot`
- Inserting a capability adds a preconfigured node to the canvas

**Acceptance criteria:**
- Capability list loads in under 1s
- Search filters capabilities by name/tag
- Inserted node contains the capability's default config

**Dependencies:** AS-1, marketplace API

---

### AS-3 Model routing and budget configuration

**Priority:** P1  
**Estimate:** 3 days

Add model selection, routing rules, and cost budgets per workflow.

**Scope:**
- Node inspector panel: select provider/model, set max tokens, temperature
- Workflow-level budget: `maxCostPerRun`, `maxTokensPerDay`
- Routing preview: estimate cost before execution

**Acceptance criteria:**
- Changing model updates node config and persists on save
- Exceeding budget shows warning and disables Run
- Routing preview returns estimated cost within 500ms

**Dependencies:** AS-1, `/api/llm/providers` endpoint

---

### AS-4 Simulation sandbox

**Priority:** P1  
**Estimate:** 3 days

Run workflows in a sandboxed environment without side effects.

**Scope:**
- `POST /api/agent-studio/workflows/:id/simulate`
- Returns mock execution trace: node outputs, timing, token usage
- No real API calls; deterministic mock responses

**Acceptance criteria:**
- Simulation completes in under 5s for 10-node workflows
- Output includes per-node latency and estimated cost
- Failed node simulation surfaces error in inspector

**Dependencies:** AS-1, AS-3

---

### AS-5 A/B testing and versioning

**Priority:** P2  
**Estimate:** 2 days

Allow versioning of workflow configs and A/B comparison.

**Scope:**
- `POST /api/agent-studio/workflows/:id/versions`
- `GET /api/agent-studio/workflows/:id/versions/:versionId`
- Compare two versions side-by-side in UI

**Acceptance criteria:**
- Saving a version creates an immutable snapshot
- Comparison highlights node/config differences
- Can promote a version to active

**Dependencies:** AS-1

---

## Q1 2027 — ALP Mobile App (Beta)

**Epic:** Native iOS/Android companion for HITL approval, push notifications, and swarm monitoring.

### MA-1 Mobile app scaffold and auth

**Priority:** P0  
**Estimate:** 3 days

Initialize Expo or native projects with shared ALP API client.

**Scope:**
- Expo managed workflow (iOS + Android from one repo)
- Auth: email/password login + SSO/SAML for Enterprise
- Token storage: Expo SecureStore
- Deep linking to enterprise app URLs

**Acceptance criteria:**
- Login with demo credentials succeeds and stores token
- SSO redirects back to app with token
- App survives background/foreground without re-login

**Dependencies:** Enterprise app auth API

---

### MA-2 HITL checkpoint approval flow

**Priority:** P0  
**Estimate:** 3 days

Build the review/approve/reject UI for human-in-the-loop tasks.

**Scope:**
- List of pending checkpoints from `GET /api/tasks?status=pending_review`
- Detail view: task context, agent output, risk flags
- Actions: Approve, Reject with reason, Escalate

**Acceptance criteria:**
- Pending checkpoints load in under 2s
- Approve sends `POST /api/tasks/:id/approve`
- Reject requires a reason and sends `POST /api/tasks/:id/reject`

**Dependencies:** HITL task API endpoints

---

### MA-3 Push notifications

**Priority:** P1  
**Estimate:** 2 days

Add push notifications for blocked/failed tasks.

**Scope:**
- Expo Notifications integration
- Register device token on login
- Backend: `POST /api/devices` stores token per user
- Trigger: failed task → push notification

**Acceptance criteria:**
- User receives push within 30s of task failure
- Tapping notification opens task detail
- Unregister on logout

**Dependencies:** MA-1, notification backend

---

### MA-4 Swarm activity feed

**Priority:** P1  
**Estimate:** 3 days

Real-time feed of agent swarm events.

**Scope:**
- WebSocket connection to `/api/events` (or Socket.IO)
- Flat feed: task started, completed, failed, checkpoint created
- Pull-to-refresh + infinite scroll

**Acceptance criteria:**
- New events appear within 1s of server emission
- Feed loads 50 items instantly
- Offline: cached feed visible, background sync on reconnect

**Dependencies:** Event mesh or Socket.IO server

---

### MA-5 Offline task history

**Priority:** P2  
**Estimate:** 2 days

Cache task history for offline review.

**Scope:**
- SQLite via `expo-sqlite`
- Background sync when online
- Search/filter cached tasks

**Acceptance criteria:**
- App shows cached tasks when airplane mode is on
- Sync reconciles server state on reconnect
- Search filters cached results in under 500ms

**Dependencies:** MA-4

---

## Q2 2027 — ALP Security Scanner

**Epic:** SAST/DAST scanner with policy-as-code and compliance reporting.

### SS-1 SAST engine integration

**Priority:** P0  
**Estimate:** 4 days

Integrate Semgrep for static analysis.

**Scope:**
- Service: `POST /api/security/sast/scan` with repo URL or uploaded tarball
- Run Semgrep in Docker; stream findings
- Normalize findings to ALP finding schema

**Acceptance criteria:**
- Scan of 1K-line repo completes in under 30s
- Findings include rule ID, severity, file, line, message
- Empty scan returns zero findings, not error

**Dependencies:** Semgrep Docker image, security service

---

### SS-2 Policy-as-code verification gate

**Priority:** P0  
**Estimate:** 3 days

Add security verification to `@task verify` blocks.

**Scope:**
- New verify action: `security-scan`
- `verify` block in `.alp` file: `verify: [security-scan, npm test]`
- Policy rules in `@policy` with severity thresholds

**Acceptance criteria:**
- Task fails verification if critical finding is above threshold
- Policy rules can block specific patterns (e.g., `no-hardcoded-secrets`)
- Results written to `@timeline`

**Dependencies:** SS-1, parser verify extension

---

### SS-3 Compliance report generation

**Priority:** P1  
**Estimate:** 3 days

Generate SOC2/ISO27001/GDPR compliance reports from scan history.

**Scope:**
- `GET /api/security/compliance/:framework`
- Report: passed/failed controls, evidence links, trend data
- PDF export via Puppeteer or similar

**Acceptance criteria:**
- Report includes all controls for requested framework
- PDF renders correctly in A4 format
- Re-run with same date range produces identical report

**Dependencies:** SS-1, findings persisted

---

### SS-4 Security dashboard in enterprise app

**Priority:** P1  
**Estimate:** 3 days

Build the security score and findings dashboard.

**Scope:**
- Route: `/security` in enterprise app
- Cards: open findings by severity, trend over time, compliance status
- Findings table with filter/sort

**Acceptance criteria:**
- Dashboard loads in under 2s for 10K findings
- Severity filter updates table instantly
- Click finding opens detail with file/line context

**Dependencies:** SS-1, SS-3

---

## Backlog / Later Quarters

| Ticket ID | Product | Title | Quarter |
|---|---|---|---|
| AB-1 | Analytics & BI | Event mesh analytics pipeline + ClickHouse ingestion | Q3 2027 |
| AB-2 | Analytics & BI | BI dashboard with Chart.js + custom reports | Q3 2027 |
| DB-1 | DevOps Bridge | GitHub Actions/GitLab CI webhook receiver | Q4 2027 |
| DB-2 | DevOps Bridge | Kubernetes operator for deployment orchestration | Q4 2027 |
| MH-1 | AI Model Hub | Model registry + card frontend | Q2 2028 |
| MH-2 | AI Model Hub | Token routing service with cost/latency scoring | Q2 2028 |
| HE-1 | Hybrid Engineer AI | Firmware/HAL code generation module | Q3 2028 |
| HE-2 | Hybrid Engineer AI | Digital twin sync engine | Q3 2028 |
| QE-1 | Quantum Engineering AI | Qiskit circuit optimizer module | Q4 2028 |
| QE-2 | Quantum Engineering AI | QPU job orchestrator + calibration scheduler | Q4 2028 |
| CD-1 | Chip Design Studio | RTL generator + synthesis wrapper | Q1 2029 |
| CD-2 | Chip Design Studio | P&R flow + timing closure dashboard | Q1 2029 |
| SOC-1 | SOC Sentinel AI | Event stream anomaly detection service | Q2 2029 |
| SOC-2 | SOC Sentinel AI | SOC dashboard + MITRE ATT&CK mapping | Q2 2029 |
| TI-1 | Threat Intelligence Engine | Vulnerability scanner + SBOM generator | Q3 2029 |
| TI-2 | Threat Intelligence Engine | Threat feed ingestion + exploit prediction model | Q3 2029 |
| ZT-1 | Zero Trust Orchestrator | SPIFFE/SPIRE identity provisioning | Q4 2029 |
| ZT-2 | Zero Trust Orchestrator | OPA policy engine + mTLS sidecar injection | Q4 2029 |

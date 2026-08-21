# Multi-Modal & VLA Protocol

**Autonomous Lifecycle Protocol (ALP) v82.0.0** introduces **Multi-Modal & VLA** — a first-class protocol for vision-language-action, sensor fusion, and embodied AI agent primitives.

Multi-Modal extends ALP beyond text-based task coordination into a unified specification layer for autonomous agents that perceive, reason, and act across vision, audio, sensor, and spatial modalities.

---

## Key Capabilities

| Feature | Description |
| :--- | :--- |
| **@multimodal** | Declare sensor pipelines, resolution, FPS, embedding dimensions, and asset manifests. |
| **@vision_model** | Bind vision backbones (CLIP, SigLIP, GPT-4o Vision, etc.) with context token budgets and latency targets. |
| **@action_space** | Define bounded digital/physical/API/RPC/actuator actions with safety levels, confirmation gates, and parameter schemas. |
| **Token Budgeting** | Automatic context-window estimation across modalities and assets against a vision model cap. |
| **Safety Guards** | Critical-action confirmation, human-in-the-loop enforcement, and parameter validation. |

---

## Directive Reference

### @multimodal

Declares a multi-modal perception pipeline.

```alp
@multimodal
  id: mm-inspection-pipeline
  modalities:
    - vision
    - sensor
    - text
  resolution: "1920x1080"
  fps: 30
  sample_rate_hz: 44100
  embedding_dim: 768
  metadata:
    source: "factory-floor-cam-01"

  assets:
    - id: cam-front
      type: image
      uri: "s3://assets/cam-front.png"
      format: png
      resolution: "1920x1080"
    - id: lidar-scan
      type: point_cloud
      uri: "s3://assets/scan.pcd"
    - id: audio-telemetry
      type: audio
      uri: "s3://assets/audio.wav"
      format: wav
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Unique multimodal spec identifier |
| `modalities` | string[] | Yes | Active modalities: `vision`, `audio`, `sensor`, `text`, `spatial` |
| `resolution` | string | No | Max sensor resolution (e.g. `1920x1080`) |
| `fps` | number | No | Frames per second for vision/video streams |
| `sample_rate_hz` | number | No | Audio sample rate |
| `embedding_dim` | number | No | Shared embedding dimension |
| `assets` | MultiModalAsset[] | No | Attached media assets |
| `metadata` | object | No | Arbitrary pipeline metadata |

### @vision_model

Declares a vision backbone configuration.

```alp
@vision_model
  id: model-siglip-base
  backbone: siglip
  embedding_dim: 768
  max_resolution: "1024x1024"
  context_tokens: 4096
  latency_p95_ms: 45
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Unique model identifier |
| `backbone` | string | Yes | Model family: `clip`, `siglip`, `gpt-4o-vision`, `gemini-vision`, `claude-vision`, `custom` |
| `embedding_dim` | number | No | Output vector dimension |
| `max_resolution` | string | No | Max supported resolution |
| `context_tokens` | number | No | Maximum context window in tokens |
| `latency_p95_ms` | number | No | Target p95 inference latency |

### @action_space

Declares the bounded action surface for an embodied agent.

```alp
@action_space
  id: act-browser-nav
  agent: agent-vla-controller
  domain: browser
  max_concurrency: 4
  safety_guards:
    - guard-origin-whitelist
    - guard-action-budget

  actions:
    - name: click_element
      type: digital
      safety_level: low
      latency_budget_ms: 100
      parameters:
        - name: selector
          type: string
          required: true
          description: "CSS selector of target element"

    - name: submit_transaction
      type: api
      safety_level: critical
      requires_confirmation: true
      parameters:
        - name: transaction_id
          type: string
          required: true
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | Yes | Unique action space identifier |
| `agent` | string | No | Bound agent ID |
| `domain` | string | No | `browser`, `robotics`, `desktop`, `cloud`, `embedded` |
| `max_concurrency` | number | No | Max parallel actions |
| `safety_guards` | string[] | No | Active safety guard identifiers |
| `actions` | ActionDefinition[] | Yes | Declared actions |

#### ActionDefinition

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Action identifier |
| `type` | string | Yes | `digital`, `physical`, `api`, `rpc`, `actuator` |
| `safety_level` | string | Yes | `low`, `medium`, `high`, `critical` |
| `requires_confirmation` | boolean | No | Require human confirmation before execution |
| `latency_budget_ms` | number | No | Max allowed latency |
| `parameters` | ActionParameter[] | No | Input schema |

#### ActionParameter

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | string | Yes | Parameter name |
| `type` | string | Yes | `string`, `number`, `boolean`, `object`, `array` |
| `required` | boolean | No | Whether the parameter is mandatory |
| `description` | string | No | Human-readable description |
| `default` | any | No | Default value |

---

## Safety Levels

| Level | Meaning | Default Behavior |
| :--- | :--- | :--- |
| `low` | Safe to execute without oversight | Auto-execute |
| `medium` | Minor side effects; log and execute | Log + execute |
| `high` | Significant side effects; warn | Warn + execute |
| `critical` | Destructive or irreversible | **Blocked** unless `requires_confirmation: true` is satisfied |

---

## CLI Commands

### Inspect Multi-Modal Specs

```bash
alp multimodal inspect
```

Outputs all `@multimodal`, `@action_space`, and `@vision_model` objects with token budget estimates.

```bash
alp multimodal inspect --json
```

Raw JSON output for piping.

### Validate Multi-Modal Specs

```bash
alp multimodal validate
```

Validates all multimodal specifications for required fields, asset URIs, and token budget sanity.

### Check Action Space Safety

```bash
alp action-space check
alp action-space check --id act-browser-nav
```

Verifies action safety guards and flags unconfirmed critical actions.

---

## TypeScript SDK

```ts
import {
  MultiModalEngine,
  MultiModalBridge,
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '@autonomous-lifecycle-protocol-alp/sdk';

const engine = new MultiModalEngine();
const bridge = new MultiModalBridge();

// Validate a multimodal spec
const mm: AlpMultimodal = {
  id: 'mm-factory-floor',
  modalities: ['vision', 'sensor', 'audio'],
  assets: [
    { id: 'cam-1', type: 'image', uri: 's3://bucket/cam-1.png' },
    { id: 'mic-1', type: 'audio', uri: 's3://bucket/mic-1.wav' },
  ],
};

const validation = engine.validateMultimodal(mm);
console.log('Valid:', validation.valid);
console.log('Est. Tokens:', validation.totalTokensEstimate);

// Estimate context budget against a vision model
const model: AlpVisionModel = {
  id: 'vm-siglip',
  backbone: 'siglip',
  context_tokens: 4096,
};
const budget = bridge.estimateContextBudget(mm, model);
console.log(`Budget: ${budget.totalTokens} / ${budget.maxContextTokens} (${budget.budgetPercent}%)`);

// Validate action execution safety
const space: AlpActionSpace = {
  id: 'as-robotic-arm',
  domain: 'robotics',
  actions: [
    { name: 'grip_object', type: 'actuator', safety_level: 'medium' },
    { name: 'emergency_stop', type: 'physical', safety_level: 'critical', requires_confirmation: true },
  ],
};

const result = bridge.validateActionExecution(space, 'emergency_stop', {}, true);
console.log('Allowed:', result.allowed);
console.log('Reason:', result.reason);

// Fuse multimodal streams into an LLM-ready payload
const fused = bridge.fuseMultimodalStreams('Analyze defects', mm.assets || []);
console.log(fused.promptPayload);
```

---

## VS Code Extension

The ALP VS Code extension provides dedicated webview panels:

- **ALP: Show Multi-Modal Specs** — Browse `@multimodal` definitions
- **ALP: Show Action Spaces** — Inspect action safety levels and guards
- **ALP: Show Vision Models** — Review vision backbone configurations

---

## SHAM IDE

The SHAM desktop IDE includes a full **Multi-Modal Panel** with four tabs:

1. **Overview** — Stats grid, modality chips, token budget bar
2. **Assets** — All multimodal assets with URI, resolution, and format
3. **Actions** — Action space cards with safety guard enforcement status
4. **Simulator** — Dry-run action execution sandbox with parameter forms and confirmation gates

---

## Playground

The ALP Playground includes a **Multi-Modal Modal** with five tabs:

1. **Specs** — Context window budget bar and multimodal spec cards
2. **Actions** — Action space explorer with safety-colored badges and execution sandbox
3. **Models** — Vision model cards with backbone, context tokens, and latency
4. **Stream Feed Simulator** — Live camera preview and audio/sensor telemetry simulation
5. **JSON Export** — Copy or download raw multimodal JSON

Load the **Multi-Modal & VLA Action Space** template from the Playground template selector to experiment.

---

## Template

```bash
alp init --template multimodal
```

Or reference the canonical template directly:

- `templates/multimodal.alp`

---

## Related

- [Synapse Knowledge Graph](/guide/synapse)
- [CLI Guide](/guide/cli)
- [SDKs](/guide/sdk)
- [VS Code Extension](/vscode-extension)
- [SHAM IDE](/sham)

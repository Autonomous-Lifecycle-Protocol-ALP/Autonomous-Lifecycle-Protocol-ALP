---
title: ALP AI Model Hub
---

# ALP AI Model Hub

Curated marketplace of ALP-optimized AI models for code review, test generation, documentation, and general-purpose task execution.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | Browse and invoke public models |
| Pro | 15% fee on usage | Private model hosting, A/B testing, routing |

## Feature Deep-Dive

### Task-Optimized Models
Models fine-tuned or routed for specific ALP task types: code review, test generation, documentation, data extraction, and planning. Each model card includes latency, cost, and quality benchmarks.

### A/B Testing
Route a percentage of tasks to two models and compare output quality, token cost, and latency. Statistical significance testing is built in.

### Cost Optimization Routing
ALP automatically selects the cheapest model that meets quality thresholds. Fallback chains handle model outages or rate limits without human intervention.

### Custom Model Registration
Register your own fine-tuned models. The hub handles versioning, A/B rollout, and metering via the `@swarm_marketplace` economy.

### Performance Tracking
Every model invocation is recorded in the ALP timeline. Track p50/p95 latency, hallucination rates, and user feedback over time.

## Use Cases

- **Teams** that want best-of-breed models without vendor lock-in.
- **Marketplace operators** listing ALP-optimized models to the ecosystem.
- **Finance teams** optimizing model spend via automatic routing.

## Integration

Integrates with `@agent` model config, `@swarm_marketplace` metering, and `@policy` governance. Models are invoked as ALP tasks with full observability.

## Quickstart

1. Browse models: `alp hub search --task code-review`
2. Invoke a model: `alp run --model alp/code-review-v2 --input src/`
3. Compare models: `alp hub ab --model-a alp/code-review-v1 --model-b alp/code-review-v2`
4. Register your model: `alp hub publish --model ./my-model --price 0.001/token`

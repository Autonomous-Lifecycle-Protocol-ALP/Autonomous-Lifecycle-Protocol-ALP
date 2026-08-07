---
title: ALP Data Pipeline Studio
---

# ALP Data Pipeline Studio

Build and monitor data pipelines with ALP DAG orchestration, schema validation, data quality gates, and dbt/Airflow integration.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| Enterprise Add-on | +$2,000 / mo | Unlimited pipelines, dbt/Airflow sync, lineage |

## Feature Deep-Dive

### Visual Pipeline Designer
Compose extract, transform, load, and validation steps as ALP `@task` and `@workflow` blocks. Drag-and-drop canvas with real-time validation against `@contract` schemas.

### Schema Validation & Evolution
Every pipeline step validates input and output against declared schemas. ALP detects breaking schema changes and generates migration tasks automatically.

### Data Quality Gates
Define expectations in `.alp` `@expect` blocks: row counts, nullability, uniqueness, and distribution checks. Failed gates halt downstream tasks and alert via `@policy`.

### ML Experiment Tracking
Log datasets, model versions, and metrics as ALP events. Compare experiment runs in the Enterprise Dashboard with full reproducibility from the timeline.

### dbt / Airflow Integration
Sync ALP pipelines to dbt models and Airflow DAGs. ALP can trigger and monitor non-ALP jobs, unifying orchestration across your stack.

### Data Lineage Visualization
Auto-generated lineage graphs show how data flows from source to destination. Compliance teams use lineage for GDPR and SOX audits.

## Use Cases

- **Data teams** orchestrating ETL/ELT with ALP-native observability.
- **ML teams** tracking experiments and model promotions.
- **Compliance teams** needing immutable data lineage and audit trails.

## Integration

Creates `@task`/`@workflow` for pipeline orchestration, `@contract` for schema boundaries, and `@analytics` for pipeline metrics.

## Quickstart

1. Install the studio plugin: `npm install -g @alp/data-pipeline-studio@80.0.0`
2. Initialize a pipeline project: `alp init data-pipeline --template etl`
3. Design in the visual editor or write `.alp` files directly.
4. Sync with dbt: `alp pipeline sync --dbt ./dbt-project`
5. Monitor in the Enterprise Dashboard under Data Pipelines.

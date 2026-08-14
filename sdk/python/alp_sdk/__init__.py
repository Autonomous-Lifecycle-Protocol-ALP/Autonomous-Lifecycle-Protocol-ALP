"""ALP Python SDK"""

__version__ = "80.0.0"

# ──────────────────────────── Core ────────────────────────────
from .models import AlpObject
from .error import AlpError, SyntaxError, IndentationError, ValidationError, DirectiveError
from .reader import load_workspace, AlpReader, AlpParser
from .validator import validate_object, verify_workspace

# ──────────────────────────── Planning & Negotiation ────────────────────────────
from .planner import (
    GoalDecomposer,
    Planner,
    Reflector,
    Plan,
    PlanNode,
    Lesson,
    ReasoningTracer,
    ReasoningChain,
    ReasoningStep,
    CollabPlanner,
    AgentContribution,
    CollabPlanResult,
    ImprovementProposal,
)
from .negotiate import Negotiator, ReputationStore, TeamComposer, Offer, ContractDraft, NegotiationResult, Capability

# ──────────────────────────── Provenance & Tracing ────────────────────────────
from .provenance import TraceSigner, ProvenanceStore, AuditLedger, VerifiableCredential
from .trace import TraceEntry, TraceStore, MerkleTree, verify_trace_integrity

# ──────────────────────────── Graph & Memory ────────────────────────────
from .graph import AlpGraph, GraphNode, GraphEdge
from .memory import MemoryStore, MemoryEntry, MemoryQuery, MemoryGraph, MemoryConsolidator, MemoryConsolidation

# ──────────────────────────── Policy & Governance ────────────────────────────
from .policy import (
    PolicyEngine,
    PolicyDecision,
    PolicyQuery,
    PolicySuggestion,
    PolicyVersion,
    PolicyRollback,
    TimeWindow,
    ApprovalRule,
    PolicyProposal,
    FederatedTrustRoot as PolicyFederatedTrustRoot,
    glob_to_regexp,
    normalize_objects,
    parse_inline_object,
    PolicyLearner,
    PolicyContext,
)
from .predictive_policy import PredictivePolicyEngine, AnomalyScore, BaselineProfile
from .governance import (
    PolicyBallot,
    GovernanceEngine,
    BallotRecord,
    GovernanceReport,
    Vote,
    VoteValue,
)
from .policy_federation import (
    PolicyFederation,
    PolicySource,
    FederatedDecision,
    FederatedTrustRoot,
)

# ──────────────────────────── Execution & Runtime ────────────────────────────
from .engine import (
    LoopEngine,
    LoopConfig,
    LoopCheckpoint,
    LoopEvent,
    WorkflowEngine,
    RetryStrategy,
    StepResult,
    ContextEngine,
    VerificationEngine,
    VerificationResult,
    VerificationReport,
    EngineError,
    LOOP_STAGES,
)
from .alpel import (
    AlpelError,
    build_context,
    evaluate,
    evaluate_bool,
    interpolate,
    register_module,
    import_module,
)
from .workspace import (
    WorkspaceLoader,
    WorkspaceError,
    ProjectEntry,
    CrossProjectReference,
)
from .schedule import TimelineEngine, TimelineResult
from .contract import ContractEngine, ContractResult, ContractViolation, ContractObject
from .execution_quota import ExecutionQuotaEngine, ExecutionQuota
from .sandbox_env import SandboxEnvEngine, SandboxInstance

# ──────────────────────────── Security & Identity ────────────────────────────
from .signing import (
    Signature,
    fingerprint,
    generate_keypair,
    signing_payload,
    sign,
    verify,
    resolve_public_key,
)
from .identity import (
    AgentIdentity,
    VerifiablePresentation,
    TrustRegistry,
    IdentityResolver,
    AgentKeyStore,
    create_did,
    generate_keypair as generate_identity_keypair,
)
from .p2p import (
    P2PSwarm,
    P2PReport,
    P2PNode,
    GossipMessage,
    GossipProtocol,
    DHT,
    AgentStatus as P2PAgentStatus,
)
from .tenant import (
    TenantVault,
    TenantContext,
    TenantManager,
    TenantIsolationError,
    create_tenant_key,
)
from .domain_trust import (
    DomainTrustAnchor,
    DomainTrustManager,
    TrustRoot,
    DomainLink,
    TrustStatus,
    create_domain_keypair,
)
from .zk_proof import ZKProofEngine, ZKProof
from .did_identity import DIDIdentityEngine, DIDDocument

# ──────────────────────────── Storage & Sync ────────────────────────────
from .vault import Vault, SealedSecret, VaultAuditEntry
from .vector_store import VectorStoreEngine, VectorEntry
from .crdt_sync import CRDTSyncEngine, CRDTState
from .crdt import LWWRegister, ORSet, EdgeRuntime
from .event_store import Event, EventStore, EVENT_SCHEMA_VERSION
from .memory_mesh import (
    MemoryMeshEngine,
    MemoryNode,
    MemoryQueryResult,
    MemoryMeshStats,
)

# ──────────────────────────── Intelligence & AI ────────────────────────────
from .analytics import compute_analytics, PredictiveEstimator
from .anomaly import AnomalyDetector
from .swarm_intelligence import (
    SwarmSignal,
    EmergentPattern,
    AgentSpecialization,
    EmergentBehaviorDetector,
    RoleSpecializer,
    CollectiveVote,
    CollectiveDecision,
    CollectiveDecisionMaker,
)
from .intelligence import (
    IntelligenceEngine,
    SmartSuggestion,
    DiagnosisResult,
    PredictionResult,
    ReviewFinding,
)

# ──────────────────────────── Resilience & Healing ────────────────────────────
from .self_healing import SelfHealingEngine, ASTDiagnosis
from .resilience import (
    ResilientSwarm,
    ResilienceReport,
    AgentNode,
    TaskAssignment,
    QuorumConsensus,
    AgentStatus,
)
from .healing import HealingEngine, HealingReport, HealingAction, HealingContext, HealingStrategy, CircuitBreaker

# ──────────────────────────── Engineering Tools ────────────────────────────
from .refactor_engine import RefactorEngine, RenameResult
from .copy_engine import CopyEngine, CopyResult
from .move_engine import MoveEngine, MoveResult
from .dependency_engine import DependencyEngine, DependencyResult
from .search_engine import SearchEngine, SearchResult
from .inspect_engine import InspectEngine, InspectResult
from .delete_engine import DeleteEngine, DeleteResult
from .format_engine import FormatEngine
from .code_transform import CodeTransformEngine, CodeTransformConfig
from .code_index import CodeIndexEngine, CodeIndexConfig
from .edge_model import EdgeModelEngine, EdgeModelConfig
from .arch_decomposer import ArchDecomposerEngine, MicroservicePlan

# ──────────────────────────── Formal Methods ────────────────────────────
from .formal import (
    PolicyModelChecker,
    ContractInvariant,
    VerificationProof,
    VerificationProperty,
    CounterexampleTrace,
    ZKPolicyProof,
    ComplianceCertifier,
)
from .formal_verification import FormalVerificationEngine, Transition
from .visualize import (
    WorkflowVisualizer,
    ParsedWorkflow,
    WorkflowStep,
    DiagramFormat,
    read_workflow,
)

# ──────────────────────────── Observability & Cost ────────────────────────────
from .telemetry import TelemetryEngine, Span
from .observ import (
    RuntimeLog,
    StateStore,
    MeteringLog,
    CostAnalyzer,
    RUNTIME_EVENT_TYPES,
    runtime_dir,
    runtime_log_path,
)
from .cost_optimizer import (
    CostOptimizer,
    CostEstimator,
    OptimizationPlan,
    OptimizationSuggestion,
    AutoScaleRecommendation,
)
from .cost_budget import CostBudgetEngine, CostBudget

# ──────────────────────────── Bridges & Extensions ────────────────────────────
from .bridge import (
    ProtocolBridge,
    BridgeExportResult,
    BridgeImportResult,
    BridgeError,
    SUPPORTED_FORMATS,
)
from .plugin import PluginResolver, CustomType, TypeProperty, PluginInfo
from .registry import (
    RegistryClient,
    load_alprc,
    semver_cmp,
    satisfies,
    verify_version_signature,
    VersionConflictError,
    parse_registry_alias,
    resolve_dependency_graph,
)

# ──────────────────────────── Debug & Snapshots ────────────────────────────
from .debug import (
    EngineSnapshot,
    SnapshotStore,
    DiffResult as DebugDiffResult,
    DebugSession,
)
from .snapshot import SnapshotEngine, WorkspaceSnapshot, SnapshotDiff
from .diff_engine import DiffEngine, DiffResult, DiffEntry

# ──────────────────────────── Federation & Mesh ────────────────────────────
from .event_mesh import EventMeshEngine, EventMeshConfig
from .tenant_mesh import TenantMeshEngine, TenantMesh
from .swarm_marketplace import SwarmMarketplaceEngine, SkillListing
from .consensus_vote import ConsensusVoteEngine, ConsensusVoteConfig

# ──────────────────────────── Quality & Eval ────────────────────────────
from .eval_suite import EvalSuiteEngine, EvalSuiteConfig
from .test_runner import (
    TestRunner,
    TestCase,
    TestSuiteResult,
    CoverageReport,
)
from .test_engine import TestEngine, TestSuiteResult
from .linter import (
    Linter,
    LintRule,
    LintDiagnostic,
)
from .formatter import (
    AlpFormatter,
    FormatOptions,
    FormatResult,
)
from .compliance import run_suite, HarnessResult

# ──────────────────────────── Specialized Engines ────────────────────────────
from .asset_context import AssetContextEngine, AssetBundle
from .archive_engine import ArchiveEngine
from .deduplicate_engine import DeduplicateEngine
from .graph_engine import GraphEngine
from .linter_engine import LintEngine
from .promote_engine import PromoteEngine
from .status_engine import StatusEngine
from .visualize_engine import VisualizeEngine
from .wasm_ast import WasmAstEvaluator, ASTNode, ASTDiagnostic, ASTEvaluationResult
from .macro import MacroEngine, MacroDefinition
from .collaboration import (
    CollaborationEngine,
    CollabSession,
    CollabOperation,
    PresenceInfo,
    CollabBranch,
    TeamPermission,
    Comment,
    ReviewThread,
    ActivityEvent,
    LiveShareSession,
    AuditEvent,
)
from .migration import MigrationEngine, UpgradeManifest, MigrationRecord, MigrationStatus, UpgradeStrategy
from .stats_engine import StatsEngine, WorkspaceStats, FileStats
from .template_engine import TemplateEngine
from .author import WorkflowAuthor, AuthoringError
from .autonomy import WorkflowMutator, AdaptiveEngine, AutonomyController, EditProposal

__all__ = [
    # Core
    "AlpObject",
    "load_workspace",
    "AlpReader",
    "AlpParser",
    "validate_object",
    "verify_workspace",
    "AlpError",
    "SyntaxError",
    "IndentationError",
    "ValidationError",
    "DirectiveError",
    # Planning & Negotiation
    "GoalDecomposer",
    "Planner",
    "Reflector",
    "Plan",
    "PlanNode",
    "Lesson",
    "ReasoningTracer",
    "ReasoningChain",
    "ReasoningStep",
    "CollabPlanner",
    "AgentContribution",
    "CollabPlanResult",
    "ImprovementProposal",
    "Negotiator",
    "ReputationStore",
    "TeamComposer",
    "Offer",
    "ContractDraft",
    "NegotiationResult",
    "Capability",
    # Provenance & Tracing
    "TraceSigner",
    "ProvenanceStore",
    "AuditLedger",
    "VerifiableCredential",
    "TraceEntry",
    "TraceStore",
    "MerkleTree",
    "verify_trace_integrity",
    # Graph & Memory
    "AlpGraph",
    "GraphNode",
    "GraphEdge",
    "MemoryStore",
    "MemoryEntry",
    "MemoryQuery",
    "MemoryGraph",
    "MemoryConsolidator",
    "MemoryConsolidation",
    # Policy & Governance
    "PolicyEngine",
    "PolicyDecision",
    "PolicyQuery",
    "PolicySuggestion",
    "PolicyVersion",
    "PolicyRollback",
    "TimeWindow",
    "ApprovalRule",
    "PolicyProposal",
    "PolicyFederatedTrustRoot",
    "glob_to_regexp",
    "normalize_objects",
    "parse_inline_object",
    "PolicyLearner",
    "PolicyContext",
    "PredictivePolicyEngine",
    "AnomalyScore",
    "BaselineProfile",
    "PolicyBallot",
    "GovernanceEngine",
    "BallotRecord",
    "GovernanceReport",
    "Vote",
    "VoteValue",
    "PolicyFederation",
    "PolicySource",
    "FederatedDecision",
    "FederatedTrustRoot",
    # Execution & Runtime
    "LoopEngine",
    "LoopConfig",
    "LoopCheckpoint",
    "LoopEvent",
    "WorkflowEngine",
    "RetryStrategy",
    "StepResult",
    "ContextEngine",
    "VerificationEngine",
    "VerificationResult",
    "VerificationReport",
    "EngineError",
    "LOOP_STAGES",
    "AlpelError",
    "build_context",
    "evaluate",
    "evaluate_bool",
    "interpolate",
    "register_module",
    "import_module",
    "WorkspaceLoader",
    "WorkspaceError",
    "ProjectEntry",
    "CrossProjectReference",
    "TimelineEngine",
    "TimelineResult",
    "ContractEngine",
    "ContractResult",
    "ContractViolation",
    "ContractObject",
    "ExecutionQuotaEngine",
    "ExecutionQuota",
    "SandboxEnvEngine",
    "SandboxInstance",
    # Security & Identity
    "Signature",
    "fingerprint",
    "generate_keypair",
    "signing_payload",
    "sign",
    "verify",
    "resolve_public_key",
    "AgentIdentity",
    "VerifiablePresentation",
    "TrustRegistry",
    "IdentityResolver",
    "AgentKeyStore",
    "create_did",
    "generate_identity_keypair",
    "P2PSwarm",
    "P2PReport",
    "P2PNode",
    "GossipMessage",
    "GossipProtocol",
    "DHT",
    "P2PAgentStatus",
    "TenantVault",
    "TenantContext",
    "TenantManager",
    "TenantIsolationError",
    "create_tenant_key",
    "DomainTrustAnchor",
    "DomainTrustManager",
    "TrustRoot",
    "DomainLink",
    "TrustStatus",
    "create_domain_keypair",
    "ZKProofEngine",
    "ZKProof",
    "DIDIdentityEngine",
    "DIDDocument",
    # Storage & Sync
    "Vault",
    "SealedSecret",
    "VaultAuditEntry",
    "VectorStoreEngine",
    "VectorEntry",
    "CRDTSyncEngine",
    "CRDTState",
    "LWWRegister",
    "ORSet",
    "EdgeRuntime",
    "Event",
    "EventStore",
    "EVENT_SCHEMA_VERSION",
    "MemoryMeshEngine",
    "MemoryNode",
    "MemoryQueryResult",
    "MemoryMeshStats",
    # Intelligence & AI
    "compute_analytics",
    "PredictiveEstimator",
    "AnomalyDetector",
    "SwarmSignal",
    "EmergentPattern",
    "AgentSpecialization",
    "EmergentBehaviorDetector",
    "RoleSpecializer",
    "CollectiveVote",
    "CollectiveDecision",
    "CollectiveDecisionMaker",
    "IntelligenceEngine",
    "SmartSuggestion",
    "DiagnosisResult",
    "PredictionResult",
    "ReviewFinding",
    # Resilience & Healing
    "SelfHealingEngine",
    "ASTDiagnosis",
    "ResilientSwarm",
    "ResilienceReport",
    "AgentNode",
    "TaskAssignment",
    "QuorumConsensus",
    "AgentStatus",
    "HealingEngine",
    "HealingReport",
    "HealingAction",
    "HealingContext",
    "HealingStrategy",
    "CircuitBreaker",
    # Engineering Tools
    "RefactorEngine",
    "RenameResult",
    "CopyEngine",
    "CopyResult",
    "MoveEngine",
    "MoveResult",
    "DependencyEngine",
    "DependencyResult",
    "SearchEngine",
    "SearchResult",
    "InspectEngine",
    "InspectResult",
    "DeleteEngine",
    "DeleteResult",
    "FormatEngine",
    "CodeTransformEngine",
    "CodeTransformConfig",
    "CodeIndexEngine",
    "CodeIndexConfig",
    "EdgeModelEngine",
    "EdgeModelConfig",
    "ArchDecomposerEngine",
    "MicroservicePlan",
    # Formal Methods
    "PolicyModelChecker",
    "ContractInvariant",
    "VerificationProof",
    "VerificationProperty",
    "CounterexampleTrace",
    "ZKPolicyProof",
    "ComplianceCertifier",
    "FormalVerificationEngine",
    "Transition",
    "WorkflowVisualizer",
    "ParsedWorkflow",
    "WorkflowStep",
    "DiagramFormat",
    "read_workflow",
    # Observability & Cost
    "TelemetryEngine",
    "Span",
    "RuntimeLog",
    "StateStore",
    "MeteringLog",
    "CostAnalyzer",
    "RUNTIME_EVENT_TYPES",
    "runtime_dir",
    "runtime_log_path",
    "CostOptimizer",
    "CostEstimator",
    "OptimizationPlan",
    "OptimizationSuggestion",
    "AutoScaleRecommendation",
    "CostBudgetEngine",
    "CostBudget",
    # Bridges & Extensions
    "ProtocolBridge",
    "BridgeExportResult",
    "BridgeImportResult",
    "BridgeError",
    "SUPPORTED_FORMATS",
    "PluginResolver",
    "CustomType",
    "TypeProperty",
    "PluginInfo",
    "RegistryClient",
    "load_alprc",
    "semver_cmp",
    "satisfies",
    "verify_version_signature",
    "VersionConflictError",
    "parse_registry_alias",
    "resolve_dependency_graph",
    # Debug & Snapshots
    "EngineSnapshot",
    "SnapshotStore",
    "DebugDiffResult",
    "DebugSession",
    "SnapshotEngine",
    "WorkspaceSnapshot",
    "SnapshotDiff",
    "DiffEngine",
    "DiffResult",
    "DiffEntry",
    # Federation & Mesh
    "EventMeshEngine",
    "EventMeshConfig",
    "TenantMeshEngine",
    "TenantMesh",
    "SwarmMarketplaceEngine",
    "SkillListing",
    "ConsensusVoteEngine",
    "ConsensusVoteConfig",
    # Quality & Eval
    "EvalSuiteEngine",
    "EvalSuiteConfig",
    "TestRunner",
    "TestCase",
    "TestSuiteResult",
    "CoverageReport",
    "TestEngine",
    "Linter",
    "LintRule",
    "LintDiagnostic",
    "AlpFormatter",
    "FormatOptions",
    "FormatResult",
    "run_suite",
    "HarnessResult",
    # Specialized Engines
    "AssetContextEngine",
    "AssetBundle",
    "ArchiveEngine",
    "DeduplicateEngine",
    "GraphEngine",
    "LintEngine",
    "PromoteEngine",
    "StatusEngine",
    "VisualizeEngine",
    "WasmAstEvaluator",
    "ASTNode",
    "ASTDiagnostic",
    "ASTEvaluationResult",
    "MacroEngine",
    "MacroDefinition",
    "CollaborationEngine",
    "CollabSession",
    "CollabOperation",
    "PresenceInfo",
    "CollabBranch",
    "TeamPermission",
    "Comment",
    "ReviewThread",
    "ActivityEvent",
    "LiveShareSession",
    "AuditEvent",
    "MigrationEngine",
    "UpgradeManifest",
    "MigrationRecord",
    "MigrationStatus",
    "UpgradeStrategy",
    "StatsEngine",
    "WorkspaceStats",
    "FileStats",
    "TemplateEngine",
    "WorkflowAuthor",
    "AuthoringError",
    "WorkflowMutator",
    "AdaptiveEngine",
    "AutonomyController",
    "EditProposal",
]

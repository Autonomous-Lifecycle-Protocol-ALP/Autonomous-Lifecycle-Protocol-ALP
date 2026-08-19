import { ToolRegistry } from "./registry";
import {
  AwsDeployTool,
  SASTScannerTool,
  PolicyValidatorTool,
  GitHubActionsTool,
  ArgoCDTool,
  OpenAPIGenTool,
  AsyncAPIGenTool,
  DiagramGenTool,
  DependencyGraphTool,
  UnitTestTool,
  IntegrationTestTool,
  E2ETestTool,
  PropertyTestTool,
  TypeScriptCodingTool,
  PythonCodingTool,
  RustCodingTool,
  GoCodingTool,
  JavaCodingTool,
  GitWorkflowTool,
  CodeFormatterTool,
  DASTScannerTool,
  DependencyCheckerTool,
  SecretScannerTool,
  LicenseCheckerTool,
  ComplianceReporterTool,
  AzureDeployTool,
  GCPDeployTool,
  KubernetesTool,
  TerraformTool,
  GitLabCITool,
  CircleCITool,
  JenkinsCITool,
  MonitoringTool,
  LintTool,
  VerilogGeneratorTool,
  SynthesisTool,
  BIExportTool,
  SBOMGeneratorTool,
  ETLPipelineTool,
  DBTTool,
  AirflowTool,
  DataQualityTool,
  VisualizationTool,
  PlaceRouteTool,
  TimingAnalysisTool,
  FormalVerificationTool,
  QPUOrchestratorTool,
  QuantumCircuitTool,
  SIEMTool,
  SOARTool,
  ThreatFeedTool,
  VulnerabilityDBTool,
  RemediationTool,
  SPIFFESPIRETool,
  MTLSTool,
  OPATool,
  FirewallTool,
  VersioningTool,
  ChangelogTool,
  RollbackTool,
  StyleCheckTool,
  PerformanceReviewTool,
  SecurityLintTool,
  SDKStubGenTool,
  ImpactAnalysisTool,
  DashboardingTool,
} from "./implementations";

export { ToolRegistry } from "./registry";

export const toolRegistry = new ToolRegistry();

export function registerDefaultTools(): ToolRegistry {
  toolRegistry.register(new AwsDeployTool());
  toolRegistry.register(new SASTScannerTool());
  toolRegistry.register(new DASTScannerTool());
  toolRegistry.register(new DependencyCheckerTool());
  toolRegistry.register(new SecretScannerTool());
  toolRegistry.register(new PolicyValidatorTool());
  toolRegistry.register(new LicenseCheckerTool());
  toolRegistry.register(new ComplianceReporterTool());
  toolRegistry.register(new SBOMGeneratorTool());
  toolRegistry.register(new VulnerabilityDBTool());
  toolRegistry.register(new ThreatFeedTool());
  toolRegistry.register(new RemediationTool());
  toolRegistry.register(new SIEMTool());
  toolRegistry.register(new SOARTool());
  toolRegistry.register(new SPIFFESPIRETool());
  toolRegistry.register(new MTLSTool());
  toolRegistry.register(new OPATool());
  toolRegistry.register(new FirewallTool());
  toolRegistry.register(new GitHubActionsTool());
  toolRegistry.register(new GitLabCITool());
  toolRegistry.register(new CircleCITool());
  toolRegistry.register(new JenkinsCITool());
  toolRegistry.register(new ArgoCDTool());
  toolRegistry.register(new TerraformTool());
  toolRegistry.register(new KubernetesTool());
  toolRegistry.register(new AzureDeployTool());
  toolRegistry.register(new GCPDeployTool());
  toolRegistry.register(new MonitoringTool());
  toolRegistry.register(new ETLPipelineTool());
  toolRegistry.register(new DBTTool());
  toolRegistry.register(new AirflowTool());
  toolRegistry.register(new DataQualityTool());
  toolRegistry.register(new VisualizationTool());
  toolRegistry.register(new BIExportTool());
  toolRegistry.register(new VerilogGeneratorTool());
  toolRegistry.register(new SynthesisTool());
  toolRegistry.register(new PlaceRouteTool());
  toolRegistry.register(new TimingAnalysisTool());
  toolRegistry.register(new FormalVerificationTool());
  toolRegistry.register(new QPUOrchestratorTool());
  toolRegistry.register(new QuantumCircuitTool());
  toolRegistry.register(new OpenAPIGenTool());
  toolRegistry.register(new AsyncAPIGenTool());
  toolRegistry.register(new SDKStubGenTool());
  toolRegistry.register(new DiagramGenTool());
  toolRegistry.register(new DependencyGraphTool());
  toolRegistry.register(new ImpactAnalysisTool());
  toolRegistry.register(new TypeScriptCodingTool());
  toolRegistry.register(new PythonCodingTool());
  toolRegistry.register(new RustCodingTool());
  toolRegistry.register(new GoCodingTool());
  toolRegistry.register(new JavaCodingTool());
  toolRegistry.register(new GitWorkflowTool());
  toolRegistry.register(new CodeFormatterTool());
  toolRegistry.register(new UnitTestTool());
  toolRegistry.register(new IntegrationTestTool());
  toolRegistry.register(new E2ETestTool());
  toolRegistry.register(new PropertyTestTool());
  toolRegistry.register(new LintTool());
  toolRegistry.register(new StyleCheckTool());
  toolRegistry.register(new PerformanceReviewTool());
  toolRegistry.register(new SecurityLintTool());
  toolRegistry.register(new VersioningTool());
  toolRegistry.register(new ChangelogTool());
  toolRegistry.register(new RollbackTool());
  toolRegistry.register(new DashboardingTool());
  return toolRegistry;
}

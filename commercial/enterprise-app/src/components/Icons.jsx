import * as Lu from "react-icons/lu";

const SIZE_MAP = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};

const wrap = (Icon) => {
  const Component = ({ size = "md", className = "" }) => (
    <Icon className={`${SIZE_MAP[size]} ${className}`.trim()} />
  );
  Component.displayName = Icon.displayName || Icon.name;
  return Component;
};

export const DashboardIcon = wrap(Lu.LuLayoutDashboard);
export const WorkspaceIcon = wrap(Lu.LuFolderCode);
export const BusinessModelIcon = wrap(Lu.LuChartBarBig);
export const ProductsIcon = wrap(Lu.LuBox);
export const HybridEngineerIcon = wrap(Lu.LuCpu);
export const QuantumEngineerIcon = wrap(Lu.LuAtom);
export const ChipDesignIcon = wrap(Lu.LuCircuitBoard);
export const DocsIcon = wrap(Lu.LuBook);
export const SavingsIcon = wrap(Lu.LuPiggyBank);
export const BillingIcon = wrap(Lu.LuReceipt);
export const SecurityIcon = wrap(Lu.LuShieldCheck);
export const ThreatIntelIcon = wrap(Lu.LuRadar);
export const ZeroTrustIcon = wrap(Lu.LuShield);
export const LogoutIcon = wrap(Lu.LuLogOut);
export const MenuIcon = wrap(Lu.LuMenu);
export const CloseIcon = wrap(Lu.LuX);
export const CheckIcon = wrap(Lu.LuCheck);
export const XIcon = wrap(Lu.LuX);
export const ServerIcon = wrap(Lu.LuServer);
export const CadIcon = wrap(Lu.LuRuler);
export const SimulationIcon = wrap(Lu.LuFlaskConical);
export const ManufacturingIcon = wrap(Lu.LuCog);
export const IoTIcon = wrap(Lu.LuWifi);
export const DigitalTwinIcon = wrap(Lu.LuBlocks);
export const ZapIcon = wrap(Lu.LuZap);
export const LayersIcon = wrap(Lu.LuLayers);
export const AnalyticsIcon = wrap(Lu.LuChartColumnBig);
export const ReasoningIcon = wrap(Lu.LuBrainCircuit);
export const LogoIcon = wrap(Lu.LuCpu);
export const SparklesIcon = wrap(Lu.LuSparkles);
export const ShieldIcon = wrap(Lu.LuShieldCheck);
export const CopyIcon = wrap(Lu.LuCopy);
export const RefreshIcon = wrap(Lu.LuRefreshCw);
export const TerminalIcon = wrap(Lu.LuTerminal);
export const UsersIcon = wrap(Lu.LuUsers);
export const AlertIcon = wrap(Lu.LuTriangleAlert);
export const LightbulbIcon = wrap(Lu.LuLightbulb);
export const CodeIcon = wrap(Lu.LuCode);
export const FileTextIcon = wrap(Lu.LuFileText);
export const BellIcon = wrap(Lu.LuBell);
export const ActivityIcon = wrap(Lu.LuActivity);
export const ArrowRightIcon = wrap(Lu.LuArrowRight);
export const CheckCircleIcon = wrap(Lu.LuCircleCheck);
export const SearchIcon = wrap(Lu.LuSearch);
export const FilterIcon = wrap(Lu.LuFilter);
export const PlayIcon = wrap(Lu.LuPlay);
export const SlidersIcon = wrap(Lu.LuSlidersHorizontal);




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
const AlpBrandLogo = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 500 500" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="alp-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <path
      d="M 100 380 L 250 80 L 400 380 L 330 380 L 250 220 L 200 320 C 240 300 290 280 320 230 C 340 190 310 140 250 140 C 190 140 150 230 150 280 L 100 380 Z"
      fill="none"
      stroke="url(#alp-brand-grad)"
      strokeWidth="28"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M 120 370 C 180 330 230 280 290 260 C 330 245 345 270 325 305 C 295 355 200 340 120 370 Z"
      fill="url(#alp-brand-grad)"
      opacity="0.9"
    />
  </svg>
);

export const LogoIcon = ({ size = "md", className = "" }) => (
  <AlpBrandLogo className={`inline-block ${SIZE_MAP[size]} ${className}`.trim()} />
);
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
export const DownloadIcon = wrap(Lu.LuDownload);
export const DownloadCloudIcon = wrap(Lu.LuCloudDownload);
export const PackageIcon = wrap(Lu.LuPackage);
export const MonitorIcon = wrap(Lu.LuMonitor);
export const SmartphoneIcon = wrap(Lu.LuSmartphone);
export const HardDriveIcon = wrap(Lu.LuHardDrive);
export const ExternalLinkIcon = wrap(Lu.LuExternalLink);
export const SettingsIcon = wrap(Lu.LuSettings);
export const KeyIcon = wrap(Lu.LuKey);
export const UserIcon = wrap(Lu.LuUser);
export const SendIcon = wrap(Lu.LuSend);
export const PlusIcon = wrap(Lu.LuPlus);
export const TrashIcon = wrap(Lu.LuTrash2);
export const GlobeIcon = wrap(Lu.LuGlobe);
export const CpuIcon = wrap(Lu.LuCpu);
export const DatabaseIcon = wrap(Lu.LuDatabase);
export const RadioIcon = wrap(Lu.LuRadio);
export const StarIcon = wrap(Lu.LuStar);
export const UploadIcon = wrap(Lu.LuUpload);
export const FolderIcon = wrap(Lu.LuFolder);
export const FileCodeIcon = wrap(Lu.LuFileCode);

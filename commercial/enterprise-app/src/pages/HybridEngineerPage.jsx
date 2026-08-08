import { useState, useEffect } from "react";
import {
  ServerIcon,
  CadIcon,
  SimulationIcon,
  ManufacturingIcon,
  IoTIcon,
  DigitalTwinIcon,
  CheckIcon,
  XIcon,
} from "../components/Icons.jsx";
import { hybridEngineerApi } from "../utils/productApi.js";

const DOMAINS = [
  {
    id: "embedded",
    name: "Embedded Systems",
    icon: ServerIcon,
    description: "Firmware in C/C++ for Arduino, STM32, ESP32 — HAL generation, JTAG debugging, pin mapping",
    tools: ["PlatformIO", "OpenOCD", "GDB", "HAL Codegen"],
    example: "Generate PWM control firmware for STM32 motor driver",
  },
  {
    id: "cad",
    name: "CAD & 3D Modeling",
    icon: CadIcon,
    description: "Reads/edits STEP, Fusion 360, SolidWorks, KiCad files — parametric modeling, assembly constraints, BOM extraction",
    tools: ["PythonOCC", "Fusion 360 API", "KiCad Automation", "SolidWorks API"],
    example: "Optimize enclosure wall thickness for injection molding",
  },
  {
    id: "simulation",
    name: "Simulation & Analysis",
    icon: SimulationIcon,
    description: "FEA (ANSYS/FreeCAD FEM), CFD simulations — interprets results, suggests geometry/material changes",
    tools: ["ANSYS", "FreeCAD FEM", "ABAQUS", "ONNX Predictions"],
    example: "Run thermal simulation on PCB before firmware deploy",
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Tooling",
    icon: ManufacturingIcon,
    description: "CNC toolpath generation, G-code post-processing, DFM/DFA checks, injection-molding rules",
    tools: ["Fusion 360 CAM", "G-code Post-Processor", "DFM Checker"],
    example: "Generate CNC toolpaths and verify DFM for aluminum enclosure",
  },
  {
    id: "iot",
    name: "IoT & Sensors",
    icon: IoTIcon,
    description: "Consumes MQTT/telemetry streams, anomaly detection against policy baselines, predictive maintenance",
    tools: ["MQTT Bridge", "Anomaly Detector", "Digital Twin Sync"],
    example: "Detect bearing failure from vibration telemetry 3 days before failure",
  },
  {
    id: "digital-twin",
    name: "Digital Twin",
    icon: DigitalTwinIcon,
    description: "Live mirror of physical system state — simulation-before-deployment, predictive maintenance, multi-domain cross-validation",
    tools: ["Twin Sync Engine", "State Mirror", "Simulation Pipeline"],
    example: "Verify firmware + hardware + software contract before physical deploy",
  },
];

const WORKFLOW_STEPS = [
  { step: 1, name: "Receive Physical Constraints", desc: "Read sensor specs, CAD files, firmware requirements" },
  { step: 2, name: "Simulate & Validate", desc: "Run FEA/CFD, check against ALP policies" },
  { step: 3, name: "Generate Artifacts", desc: "Produce firmware, CAD mods, CNC toolpaths" },
  { step: 4, name: "ALP Task Coordination", desc: "Create @task/ @workflow objects with @policy enforcement" },
  { step: 5, name: "Deploy & Monitor", desc: "Deploy to hardware, monitor via digital twin telemetry" },
];

export default function HybridEngineerPage() {
  const [selectedDomain, setSelectedDomain] = useState("embedded");
  const [projects, setProjects] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hybridEngineerApi.listProjects();
      setProjects(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    setError("");
    try {
      const name = prompt("Project name:");
      if (!name) return;
      const platform = prompt("Platform (stm32, esp32, arduino, custom):") || "stm32";
      await hybridEngineerApi.createProject({ name, description: "", platform, firmware: {}, bom: [], status: "draft" });
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create project");
    }
  };

  const loadSimulations = async () => {
    try {
      const res = await hybridEngineerApi.listSimulations();
      setSimulations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">ALP Hybrid Engineer AI</h1>
        <p className="text-gray-400 mt-2">
          AI agent for <span className="font-semibold">physical + software engineering</span> —
          firmware, CAD, simulation, manufacturing, IoT, and digital twins
        </p>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Engineering Domains</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
  useEffect(() => {
    loadProjects();
    loadSimulations();
  }, []);

  return (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`flex flex-col items-center px-4 py-3 rounded-lg border-2 text-center min-w-[140px] transition-all ${
                  selectedDomain === domain.id
                    ? "border-sky-500 bg-sky-900/30"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className={`mb-1 ${
                  selectedDomain === domain.id ? "text-sky-400" : "text-gray-500"
                }`}>
                  <Icon size="lg" />
                </div>
                <span className="font-medium text-sm text-gray-300">{domain.name}</span>
              </button>
            );
          })}
        </div>

        {DOMAINS.map((domain) =>
          selectedDomain === domain.id && (
            <div key={domain.id} className="border-t border-gray-700 pt-5">
              <p className="text-gray-300 mb-3">{domain.description}</p>
              <div className="mb-3">
                <span className="text-xs text-gray-500">Tools:</span>{" "}
                <span className="text-gray-400">{domain.tools.join(", ")}</span>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-3 text-sm">
                <span className="font-medium text-gray-400">Example use:</span>{" "}
                <span className="text-gray-300">{domain.example}</span>
              </div>
            </div>
          )
        )}
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Hybrid Engineering Workflow</h2>
        <div className="space-y-4">
          {WORKFLOW_STEPS.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {step.step}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-200">{step.name}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Hardware Projects</h2>
          <button onClick={createProject} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">New Project</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadProjects} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {projects.length === 0 && <p className="text-gray-500 text-sm">No projects yet.</p>}
          {projects.map((p) => (
            <div key={p._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{p.name}</div>
                <div className="text-xs text-gray-500">{p.platform} • {p.status}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Simulations</h2>
          <button onClick={loadSimulations} className="text-sm text-sky-400">Refresh</button>
        </div>
        <div className="space-y-2">
          {simulations.length === 0 && <p className="text-gray-500 text-sm">No simulations yet.</p>}
          {simulations.map((s) => (
            <div key={s._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{s.type.toUpperCase()} Simulation</div>
                <div className="text-xs text-gray-500">Project: {s.projectId} • {s.status}</div>
              </div>
              <span className="text-xs text-gray-400">{s.startedAt ? new Date(s.startedAt).toLocaleString() : "Queued"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-amber-400"><ZapIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Cross-Domain Synthesis</h3>
            <p className="text-sm text-gray-400 mt-1">Firmware, CAD, simulation, and manufacturing tasks coordinate through ALP DAGs — no manual handoffs.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2 text-rose-400"><ShieldIcon size="xl" /></div>
            <h3 className="font-medium text-gray-200">Safety-Critical Enforcement</h3>
            <p className="text-sm text-gray-400 mt-1">@policy blocks dangerous operations until simulation, verification, and human approval gates pass.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-medium text-gray-200">Digital Twin Validation</h3>
            <p className="text-sm text-gray-400 mt-1">Mirror physical assets in software. Verify firmware + hardware contracts before physical deployment.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Hardware Startup Prototyping</h3>
            <p className="text-sm text-gray-400 mt-1">Generate STM32 firmware, iterate PCB layouts, and run thermal simulations without hiring a full hardware team.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Manufacturing Line Monitoring</h3>
            <p className="text-sm text-gray-400 mt-1">Detect bearing failures from vibration telemetry 3 days early. Trigger maintenance @task automatically.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Aerospace / Defense Certification</h3>
            <p className="text-sm text-gray-400 mt-1">Immutable ALP timeline with @policy and @vault provides auditable traceability for DO-178C and MIL-STD-461.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-sky-300">Robotics & Drone Swarms</h3>
            <p className="text-sm text-gray-400 mt-1">Coordinate firmware deploys, sensor calibrations, and mission replanning across heterogeneous robot fleets.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">3x</div>
            <div className="text-xs text-gray-400 mt-1">Faster Hardware Iteration</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">72h</div>
            <div className="text-xs text-gray-400 mt-1">Predictive Maintenance Lead Time</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">99.9%</div>
            <div className="text-xs text-gray-400 mt-1">Safety Gate Compliance</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">40%</div>
            <div className="text-xs text-gray-400 mt-1">Reduction in Design Rework</div>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">ALP Protocol Integration</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="border border-gray-700 rounded-lg p-4">
            <span className="font-medium text-sky-400">@task / @workflow</span>
            <p className="text-xs text-gray-500 mt-1">Creates ALP tasks for hardware validation, firmware builds, physical testing</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <span className="font-medium text-sky-400">@policy</span>
            <p className="text-xs text-gray-500 mt-1">Enforces safety-critical rules (e.g. "no firmware deploy without thermal sim pass")</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <span className="font-medium text-sky-400">@timeline</span>
            <p className="text-xs text-gray-500 mt-1">Schedules calibration, maintenance, and sensor data ingestion</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <span className="font-medium text-sky-400">@contract</span>
            <p className="text-xs text-gray-500 mt-1">Boundary enforcement between firmware, software, and hardware abstraction</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <span className="font-medium text-sky-400">@analytics</span>
            <p className="text-xs text-gray-500 mt-1">Tracks engineering KPIs: yield rate, iteration time, defect density</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <span className="font-medium text-sky-400">@vault</span>
            <p className="text-xs text-gray-500 mt-1">Secures hardware keys, firmware signing keys, and device credentials</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Pricing</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-100">Pro</h3>
            <p className="text-3xl font-bold text-sky-300 mb-4">$199/mo</p>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>5 projects, 2 engineers</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>All 6 engineering domains</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>Fully ALP-native coordination</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>Digital twin sync</span></li>
              <li className="flex items-start text-gray-500"><XIcon size="sm" className="mr-2 mt-0.5" /><span>Custom hardware integrations</span></li>
              <li className="flex items-start text-gray-500"><XIcon size="sm" className="mr-2 mt-0.5" /><span>SOC2 safety-critical compliance</span></li>
            </ul>
            <button className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700">
              Start Free Trial
            </button>
          </div>
          <div className="border-2 border-sky-500 rounded-xl p-6 bg-sky-900/20">
            <h3 className="text-xl font-bold mb-2 text-gray-100">Enterprise</h3>
            <p className="text-3xl font-bold text-sky-300 mb-4">Custom</p>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>Unlimited projects & engineers</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>Custom hardware integrations</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>SOC2 safety-critical compliance</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>On-prem deployment</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>Signed VCs & audit trail</span></li>
              <li className="flex items-start text-gray-300"><CheckIcon size="sm" className="text-green-400 mr-2 mt-0.5" /><span>Dedicated hardware support</span></li>
            </ul>
            <button className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

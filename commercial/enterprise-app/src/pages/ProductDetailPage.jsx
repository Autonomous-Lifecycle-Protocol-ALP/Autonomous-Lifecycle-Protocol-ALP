import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PRODUCTS } from "./ProductsPage.jsx";
import {
  ShieldIcon,
  ServerIcon,
  DashboardIcon,
  LayersIcon,
  PlayIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "../components/Icons.jsx";

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === id);

  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxLogs, setSandboxLogs] = useState([]);
  const [sandboxStep, setSandboxStep] = useState(0);
  const [testResults, setTestResults] = useState(null);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center card-glass p-8 rounded-3xl text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-100">404</h1>
        <p className="text-slate-400 text-sm">Product not found in ALP Enterprise catalog</p>
        <Link
          to="/products"
          className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
        >
          Back to Product Suite
        </Link>
      </div>
    );
  }

  const getAlpTestSandboxSequence = () => {
    const steps = [
      { delay: 400, log: "[ALP:TEST] Initializing ALP Test runner..." },
      { delay: 700, log: "[ALP:TEST] Discovering specs via glob: **/*.spec.{js,ts}" },
      { delay: 1000, log: "[ALP:TEST] Found 12 tests across 3 files" },
      { delay: 1300, log: "[ALP:TEST] Launching browser matrix: Chromium, Firefox, WebKit" },
      { delay: 1600, log: "[ALP:VISUAL] Capturing screenshots for baseline comparison..." },
      { delay: 1900, log: "[ALP:VISUAL] Comparing 24 viewports against saved baselines" },
      { delay: 2200, log: "[ALP:AI] Running flake prediction model on recent test history" },
      { delay: 2500, log: "[ALP:AI] Healing selector: [data-testid=\"submit-btn\"] → button[type=\"submit\"]" },
      { delay: 2800, log: "[ALP:RES] Passed: 11 | Failed: 0 | Healed: 1 | Visual diffs: 0" },
      { delay: 3100, log: "[ALP:RES] Test run completed in 2.4s. Baseline updated." },
    ];
    return steps;
  };

  const getDefaultSandboxSequence = () => {
    return [
      { delay: 400, log: `[ALP:${product.id}] Initializing ${product.name} execution engine...` },
      { delay: 800, log: "[ALP:POL] Evaluating zero-trust @policy rules... Status: PASSED" },
      { delay: 1200, log: `[ALP:DAG] Building topological task execution graph for ${product.category}...` },
      { delay: 1600, log: "[ALP:VER] Generating SHA-256 Merkle reasoning step hash..." },
      { delay: 2000, log: "[ALP:RES] Execution completed successfully. 0 defects, 100% compliance gate." },
    ];
  };

  const handleRunSandbox = () => {
    setSandboxRunning(true);
    setSandboxLogs([]);
    setSandboxStep(0);
    setTestResults(null);

    const sequence = product.id === "alp-test"
      ? getAlpTestSandboxSequence()
      : getDefaultSandboxSequence();

    sequence.forEach((step, idx) => {
      setTimeout(() => {
        setSandboxLogs((prev) => [...prev, step.log]);
        setSandboxStep(idx + 1);
        if (idx === sequence.length - 1) {
          setSandboxRunning(false);
          if (product.id === "alp-test") {
            setTestResults({
              passed: 11,
              failed: 0,
              healed: 1,
              visualDiffs: 0,
              duration: "2.4s",
            });
          } else {
            setTestResults({
              passed: 0,
              failed: 0,
              healed: 0,
              visualDiffs: 0,
              duration: "1.1s",
            });
          }
        }
      }, step.delay);
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-100">
      {/* Back Link */}
      <div>
        <Link to="/products" className="text-xs text-slate-400 hover:text-sky-300 transition font-semibold flex items-center gap-1">
          ← Back to Product Suite
        </Link>
      </div>

      {/* Main Product Card */}
      <div className="card-glass rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-sky-400">
              {product.category === "Security" ? (
                <ShieldIcon size="xl" />
              ) : product.category === "SaaS" ? (
                <ServerIcon size="xl" />
              ) : product.category === "Testing" ? (
                <PlayIcon size="xl" />
              ) : (
                <LayersIcon size="xl" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-100">{product.name}</h1>
                <span
                  className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${
                    product.status === "Beta"
                      ? "bg-sky-950/50 text-sky-300 border-sky-800/60"
                      : product.status === "Alpha"
                      ? "bg-purple-950/50 text-purple-300 border-purple-800/60"
                      : "bg-slate-900/60 text-slate-400 border-slate-800"
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{product.tagline}</p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="text-xs text-slate-400 font-semibold uppercase">Pricing Tier</div>
            <div className="text-sm font-bold text-sky-400">{product.tier}</div>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed border-t border-b border-slate-800/80 py-4">
          {product.description}
        </p>

        {/* Feature Grid & Integration */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <SparklesIcon className="text-sky-400" />
              <span>Key Capabilities</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircleIcon className="text-emerald-400 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <DashboardIcon className="text-indigo-400" />
              <span>ALP Protocol Integration</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-indigo-300">
              {product.integration}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-sky-500/20">
            Request Enterprise Access
          </button>
          <Link
            to="/docs"
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-6 py-2.5 rounded-xl text-xs font-semibold transition"
          >
            View Documentation
          </Link>
        </div>
      </div>

      {/* Interactive Try-It Sandbox Widget */}
      <div className="card-glass rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PlayIcon className="text-sky-400" />
              <span>Interactive Product Sandbox Simulator</span>
            </h2>
            <p className="text-xs text-slate-400">Dry-run product task execution and verify protocol security gates</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleRunSandbox}
              disabled={sandboxRunning}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <PlayIcon size="sm" />
              {sandboxRunning ? "Simulating Execution..." : "Run Sandbox Test"}
            </button>
            {sandboxRunning && (
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${product.id === "alp-test" ? (sandboxStep / 10) * 100 : (sandboxStep / 5) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {sandboxLogs.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-mono font-semibold uppercase text-emerald-400">
              Sandbox Console Logs:
            </div>
            <pre className="bg-slate-950 text-emerald-300 font-mono text-xs p-4 rounded-2xl border border-slate-800 custom-scrollbar overflow-x-auto space-y-1">
              {sandboxLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </pre>

            {testResults && (
              <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[11px] font-mono font-semibold uppercase text-sky-400 mb-3">
                  Test Results Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="text-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-emerald-400">{testResults.passed}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Passed</div>
                  </div>
                  <div className="text-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-red-400">{testResults.failed}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-amber-400">{testResults.healed}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Healed</div>
                  </div>
                  <div className="text-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-sky-400">{testResults.visualDiffs}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Visual Diffs</div>
                  </div>
                  <div className="text-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-indigo-400">{testResults.duration}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

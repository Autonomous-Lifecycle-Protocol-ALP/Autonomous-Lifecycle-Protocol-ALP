import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { chipDesignApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "chip-design-studio");

const DESIGN_FLOW = [
  { stage: "RTL Design", tools: "SystemVerilog, VHDL, Chisel", desc: "Write and verify register-transfer level descriptions" },
  { stage: "Synthesis", tools: "Yosys, Genus", desc: "Convert RTL to gate-level netlist" },
  { stage: "Place & Route", tools: "OpenROAD, Innovus", desc: "Physical layout with timing-driven optimization" },
  { stage: "Timing Analysis", tools: "STA, PrimeTime", desc: "Static timing analysis and sign-off" },
  { stage: "Formal Verification", tools: "Formality, JasperGold", desc: "Mathematical proof of design equivalence" },
];

const FPGA_FLOW = [
  { step: "RTL Coding", tool: "Vivado, nextpnr" },
  { step: "Synthesis", tool: "Vivado, Yosys" },
  { step: "Place & Route", tool: "Vivado, nextpnr" },
  { step: "Bitstream Generation", tool: "Vivado, openFPGALoader" },
];

const VERIFICATION_STEPS = [
  { check: "Lint", desc: "Syntax and style checking" },
  { check: "Simulation", desc: "Functional verification with testbenches" },
  { check: "Formal", desc: "Equivalence checking and property verification" },
  { check: "Timing", desc: "Setup/hold analysis and clock domain crossing" },
];

export default function ChipDesignStudioPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDesigns = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await chipDesignApi.listDesigns();
      setDesigns(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  const createDesign = async () => {
    setError("");
    try {
      const name = prompt("Design name:");
      if (!name) return;
      const technology = prompt("Technology node (e.g., 7nm, 28nm):") || "28nm";
      await chipDesignApi.createDesign({ name, technology, status: "rtl", rtl: {}, synthesis: {}, pnr: {}, sta: {} });
      await loadDesigns();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create design");
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Chip Designs</h2>
          <button onClick={createDesign} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">New Design</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadDesigns} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {designs.length === 0 && <p className="text-gray-500 text-sm">No designs yet.</p>}
          {designs.map((d) => (
            <div key={d._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{d.name}</div>
                <div className="text-xs text-gray-500">{d.technology} • {d.status}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Design Flow</h2>
        <div className="space-y-4">
          {DESIGN_FLOW.map((stage) => (
            <div key={stage.stage} className="flex gap-4 border-l-2 border-sky-500 pl-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-200">{stage.stage}</h3>
                <div className="text-xs text-sky-400 mt-1">{stage.tools}</div>
                <p className="text-sm text-gray-400 mt-1">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">FPGA Flow</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FPGA_FLOW.map((f) => (
            <div key={f.step} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{f.step}</div>
              <div className="text-xs text-sky-400 mt-1">{f.tool}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Verification Steps</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {VERIFICATION_STEPS.map((v) => (
            <div key={v.check} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-200">{v.check}</h3>
              <p className="text-sm text-gray-400 mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-200">Rapid Iteration</h3>
            <p className="text-sm text-gray-400 mt-1">Full ASIC/FPGA flow in under 1 hour for 10K-gate designs.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-medium text-gray-200">100% DRC/LVS Pass</h3>
            <p className="text-sm text-gray-400 mt-1">Automated design rule checking before tape-out.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-medium text-gray-200">IP Protection</h3>
            <p className="text-sm text-gray-400 mt-1">Air-gapped mode with vault-backed key storage for sensitive designs.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">30+</div>
            <div className="text-xs text-gray-400 mt-1">Teams in 90 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">25%</div>
            <div className="text-xs text-gray-400 mt-1">P&R Runtime Reduction</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">100%</div>
            <div className="text-xs text-gray-400 mt-1">DRC/LVS Pass Rate</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;1hr</div>
            <div className="text-xs text-gray-400 mt-1">10K-Gate Full Flow</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}

import { useState, useEffect } from "react";
import { PRODUCTS } from "./ProductsPage.jsx";
import ProductPageTemplate from "./ProductPageTemplate.jsx";
import { quantumEngineerApi } from "../utils/productApi.js";

const product = PRODUCTS.find((p) => p.id === "quantum-engineer");

const QUANTUM_DOMAINS = [
  { domain: "Circuit Design", desc: "Design quantum circuits using Qiskit, Cirq, and tket with visual editing" },
  { domain: "QPU Orchestration", desc: "Submit jobs to IBM, Rigetti, IonQ with automatic provider selection" },
  { domain: "Hybrid Algorithms", desc: "Implement VQE, QAOA, and QNN with classical-quantum co-processing" },
  { domain: "Error Mitigation", desc: "Apply zero-noise extrapolation, dynamical decoupling, and readout error mitigation" },
];

const QPU_PROVIDERS = [
  { provider: "IBM Quantum", qubits: "127+", type: "Superconducting" },
  { provider: "Rigetti", qubits: "80+", type: "Superconducting" },
  { provider: "IonQ", qubits: "32+", type: "Trapped Ion" },
  { provider: "AWS Braket", qubits: "Multi", type: "Aggregator" },
];

const ALGORITHM_LIBRARY = [
  { algorithm: "VQE", use: "Chemistry, optimization" },
  { algorithm: "QAOA", use: "Combinatorial optimization" },
  { algorithm: "QNN", use: "Classification, regression" },
  { algorithm: "Grover", use: "Unstructured search" },
  { algorithm: "Shor", use: "Integer factorization" },
];

export default function QuantumEngineerPage() {
  const [circuits, setCircuits] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCircuits = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await quantumEngineerApi.listCircuits();
      setCircuits(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load circuits");
    } finally {
      setLoading(false);
    }
  };

  const createCircuit = async () => {
    setError("");
    try {
      const name = prompt("Circuit name:");
      if (!name) return;
      const qubits = parseInt(prompt("Qubits:") || "4");
      const provider = prompt("Provider (ibm, rigetti, ionq, aws_braket):") || "ibm";
      await quantumEngineerApi.createCircuit({ name, qubits, provider, gates: [], status: "draft" });
      await loadCircuits();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create circuit");
    }
  };

  const loadJobs = async () => {
    try {
      const res = await quantumEngineerApi.listJobs();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCircuits();
    loadJobs();
  }, []);

  return (
    <ProductPageTemplate product={product}>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Circuits</h2>
          <button onClick={createCircuit} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">New Circuit</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={loadCircuits} disabled={loading} className="text-sm text-sky-400 mb-3">{loading ? "Loading..." : "Refresh"}</button>
        <div className="space-y-2">
          {circuits.length === 0 && <p className="text-gray-500 text-sm">No circuits yet.</p>}
          {circuits.map((c) => (
            <div key={c._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">{c.name}</div>
                <div className="text-xs text-gray-500">{c.qubits} qubits • {c.provider} • {c.status}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">QPU Jobs</h2>
          <button onClick={loadJobs} className="text-sm text-sky-400">Refresh</button>
        </div>
        <div className="space-y-2">
          {jobs.length === 0 && <p className="text-gray-500 text-sm">No jobs yet.</p>}
          {jobs.map((j) => (
            <div key={j._id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-200">Job {j._id.slice(-6)}</div>
                <div className="text-xs text-gray-500">{j.shots} shots • {j.status}</div>
              </div>
              <span className="text-xs text-gray-400">{j.startedAt ? new Date(j.startedAt).toLocaleString() : "Queued"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Quantum Domains</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {QUANTUM_DOMAINS.map((qd) => (
            <div key={qd.domain} className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-sky-300">{qd.domain}</h3>
              <p className="text-sm text-gray-400 mt-1">{qd.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">QPU Providers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {QPU_PROVIDERS.map((qp) => (
            <div key={qp.provider} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-gray-200">{qp.provider}</div>
              <div className="text-xs text-sky-400 mt-1">{qp.qubits} qubits</div>
              <div className="text-xs text-gray-500 mt-1">{qp.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Algorithm Library</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALGORITHM_LIBRARY.map((alg) => (
            <div key={alg.algorithm} className="border border-gray-700 rounded-lg p-4">
              <div className="font-medium text-sky-300">{alg.algorithm}</div>
              <div className="text-xs text-gray-500 mt-1">{alg.use}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Key Benefits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚛️</div>
            <h3 className="font-medium text-gray-200">Hardware-Aware Compilation</h3>
            <p className="text-sm text-gray-400 mt-1">Maps circuits to physical QPU topology with connectivity optimization.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-medium text-gray-200">Error Mitigation</h3>
            <p className="text-sm text-gray-400 mt-1">Zero-noise extrapolation and dynamical decoupling for NISQ devices.</p>
          </div>
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔗</div>
            <h3 className="font-medium text-gray-200">Hybrid Orchestration</h3>
            <p className="text-sm text-gray-400 mt-1">Seamless classical-quantum co-processing with ALP task coordination.</p>
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Success Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">50+</div>
            <div className="text-xs text-gray-400 mt-1">Researchers in 90 Days</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">30%</div>
            <div className="text-xs text-gray-400 mt-1">Gate Count Reduction</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">&lt;5min</div>
            <div className="text-xs text-gray-400 mt-1">QPU Queuing Latency</div>
          </div>
          <div className="border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sky-300">95%</div>
            <div className="text-xs text-gray-400 mt-1">Simulation Fidelity</div>
          </div>
        </div>
      </div>
    </ProductPageTemplate>
  );
}

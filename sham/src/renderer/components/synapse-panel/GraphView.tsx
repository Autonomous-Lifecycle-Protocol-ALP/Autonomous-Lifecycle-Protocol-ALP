// The force-directed SVG graph visualization lives in the existing
// ./synapse/SynapseGraphView module. Re-export it from this focused package
// so the panel can import from a single, purpose-built entry point.
export { SynapseGraphView } from '../synapse/SynapseGraphView.js';
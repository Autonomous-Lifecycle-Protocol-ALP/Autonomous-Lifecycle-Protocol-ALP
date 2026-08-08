import { describe, it, expect } from "vitest";
import { NeuromorphicSpikeMesh, AdaptiveSynapseOptimizer } from "../src/neuromorphic-engine";

describe("V86.0.0 Neuromorphic Reasoning Mesh Engine", () => {
  it("initializes default neuromorphic mesh with 4 nodes", () => {
    const mesh = new NeuromorphicSpikeMesh();
    const state = mesh.getMeshState();
    expect(state.version).toBe("v86.0.0-neuromorphic");
    expect(state.activeNodes).toBe(4);
    expect(state.totalSpikesProcessed).toBe(0);
    expect(state.averageSynapseWeight).toBeGreaterThan(0);
  });

  it("propagates spike impulse and fires cascade when threshold is crossed", () => {
    const mesh = new NeuromorphicSpikeMesh();
    const result = mesh.propagateSpike("node_sensory_0", 1.2);
    expect(result.firedSpikes.length).toBeGreaterThan(0);
    const state = mesh.getMeshState();
    expect(state.totalSpikesProcessed).toBe(1);
  });

  it("tunes synaptic weights correctly", () => {
    const mesh = new NeuromorphicSpikeMesh();
    const updated = mesh.tuneSynapseWeight("node_sensory_0", "node_cortex_1", 0.95);
    expect(updated.synapticWeights["node_cortex_1"]).toBe(0.95);
  });

  it("optimizes mesh topology by identifying pruned and strengthened synapses", () => {
    const mesh = new NeuromorphicSpikeMesh();
    const state = mesh.getMeshState();
    const opt = AdaptiveSynapseOptimizer.optimizeMeshTopology(state);
    expect(opt).toHaveProperty("prunedSynapses");
    expect(opt).toHaveProperty("strengthenedSynapses");
  });
});

import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { SwarmSelfHealingMesh } from '@autonomous-lifecycle-protocol-alp/parser';

export interface SwarmNodeHealth {
  nodeId: string;
  region: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  activeTasks: string[];
}

export interface SelfHealingPlan {
  planId: string;
  taskReroutes: { taskId: string; fromNode: string; toNode: string }[];
}

export const mesh = new SwarmSelfHealingMesh();
mesh.registerNode('node-us-east-1', 'us-east-1', 'HEALTHY', ['task-auth-service', 'task-db-migrations']);
mesh.registerNode('node-eu-central-1', 'eu-central-1', 'HEALTHY', ['task-analytics-engine']);
mesh.registerNode('node-ap-south-1', 'ap-south-1', 'FAILED', ['task-payment-gateway', 'task-email-notifications']);

export const newNodeId = 'node-us-west-2';
export const newNodeRegion = 'us-west-2';
export const nodeStatus = 'HEALTHY';

export const failures = mesh.detectFailures();

export let activePlan: SelfHealingPlan | null = null;

export const handleRegisterNode = (newNodeId: string, newRegion: string, nodeStatus: string, setNewNodeId: (v: string) => void) => {
  if (!newNodeId.trim()) return;
  mesh.registerNode(newNodeId, newRegion, nodeStatus as 'HEALTHY' | 'DEGRADED' | 'FAILED');
  setNewNodeId('');
};

export const handleSimulateFailure = (nodeId: string, setActivePlan: (v: null) => void) => {
  const node = mesh.getNode(nodeId);
  if (node) {
    mesh.registerNode(nodeId, node.region, 'FAILED', node.activeTasks);
    setActivePlan(null);
  }
};

export const generateSelfHealingPlan = (setActivePlan: (v: SelfHealingPlan) => void) => {
  const plan = mesh.generateSelfHealingPlan();
  setActivePlan(plan);
};

import { useState, useEffect } from "react";
import { getSocket } from "../services/socketService.js";

export function useRealtimeEvents() {
  const [liveEvents, setLiveEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [activeWorkflows, setActiveWorkflows] = useState({});
  const [activeNodes, setActiveNodes] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleWorkflowStepSuccess = (data) => {
      const newEvent = {
        id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Workflow Step '${data.stepId}' Completed`,
        detail: `Run: ${data.runId} • Result: ${typeof data.result === 'object' ? JSON.stringify(data.result) : String(data.result || 'Success')}`,
        status: "success",
        timestamp: "Just now",
        payload: data,
      };

      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
      setActiveWorkflows((prev) => ({
        ...prev,
        [data.runId]: {
          ...prev[data.runId],
          lastStep: data.stepId,
          lastResult: data.result,
          updatedAt: new Date().toISOString(),
        },
      }));
    };

    const handleNodeRegistered = (data) => {
      const newEvent = {
        id: `node-${Date.now()}`,
        title: `Distributed Agent Node Registered`,
        detail: `Node ID: ${data.id || data.name || 'Unnamed'} • Role: ${data.role || 'Worker'}`,
        status: "info",
        timestamp: "Just now",
        payload: data,
      };

      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
      setActiveNodes((prev) => [...prev, data]);
    };

    const handleTaskDispatched = (data) => {
      const newEvent = {
        id: `task-${Date.now()}`,
        title: `Distributed Task Dispatched`,
        detail: `Task: ${data.id || data.type || 'Sub-agent task'} to Node: ${data.nodeId || 'Auto-allocated'}`,
        status: "warning",
        timestamp: "Just now",
        payload: data,
      };

      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    };

    if (socket.connected) {
      setConnected(true);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("workflow:step_success", handleWorkflowStepSuccess);
    socket.on("node:registered", handleNodeRegistered);
    socket.on("task:dispatched", handleTaskDispatched);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("workflow:step_success", handleWorkflowStepSuccess);
      socket.off("node:registered", handleNodeRegistered);
      socket.off("task:dispatched", handleTaskDispatched);
    };
  }, []);

  return {
    connected,
    liveEvents,
    activeWorkflows,
    activeNodes,
  };
}

export default useRealtimeEvents;

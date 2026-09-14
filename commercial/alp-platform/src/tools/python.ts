import { exec } from "child_process";
import { promisify } from "util";
import { WorkflowStep } from "../types";

const execAsync = promisify(exec);

export async function executePythonStep(
  step: WorkflowStep,
  context: Record<string, unknown>,
  signal?: AbortSignal
): Promise<unknown> {
  const code = step.config?.code as string;
  if (!code) {
    throw new Error("Python executor requires 'config.code' to be provided");
  }

  // Very simple and insecure script runner for demo purposes
  // Writes code to a temp string and pipes it to python3
  const pythonCommand = `python -c "${code.replace(/"/g, '\\"')}"`;

  try {
    const { stdout, stderr } = await execAsync(pythonCommand, { signal });
    if (stderr && stderr.trim().length > 0) {
      console.warn("Python execution generated stderr:", stderr);
    }
    
    let result: unknown;
    try {
      // Try parsing stdout as JSON if possible
      result = JSON.parse(stdout.trim());
    } catch {
      // Fallback to raw string
      result = stdout.trim();
    }
    return result;
  } catch (err: any) {
    throw new Error(`Python script execution failed: ${err.message}`);
  }
}

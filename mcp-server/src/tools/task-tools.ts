import { updateObjectStatus, AlpGraph } from '@autonomous-lifecycle-protocol-alp/parser';
import { DocumentValidator } from '@autonomous-lifecycle-protocol-alp/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { toKebab, loadWorkspace } from '../workspace';
import { enforcePolicy } from '../policy';
import { audit } from '../audit';

export const toolDefinitions = [
  {
    name: 'alp_update_status',
    description: 'Update the status of a specific task in the ALP workspace',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Task ID' },
        status: { type: 'string', description: 'New status (e.g. [ ], [~], [x], [!])' },
        agent: { type: 'string', description: 'Optional acting agent (for @policy scoping)' },
        cwd: { type: 'string' }
      },
      required: ['id', 'status']
    }
  },
  {
    name: 'alp_get_impact',
    description: 'Get all downstream nodes affected by a change to the given node',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Node ID' },
        cwd: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'alp_delegate',
    description: 'Create a new task assigned to a specific role/agent (sub-agent delegation) with extended metadata.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title (used to derive the task id)' },
        agent: { type: 'string', description: 'Agent/role to assign (e.g. agent-qa)' },
        description: { type: 'string', description: 'Optional task description' },
        parent: { type: 'string', description: 'Optional parent task id this delegates from' },
        priority: { type: 'string', description: 'Priority level: high, medium, low (default medium)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Required agent skills' },
        dueDate: { type: 'string', description: 'Optional due date (ISO format or YYYY-MM-DD)' },
        context: { type: 'string', description: 'Additional context or instructions for the sub-agent' },
        cwd: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'alp_decompose',
    description: 'Split a large task into sub-tasks, each blocked by the parent.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        taskId: { type: 'string', description: 'Parent task id to decompose' },
        subtasks: { type: 'array', items: { type: 'string' }, description: 'Sub-task titles' },
        agent: { type: 'string', description: 'Optional acting agent (for @policy scoping)' },
        cwd: { type: 'string' }
      },
      required: ['taskId', 'subtasks']
    }
  },
  {
    name: 'alp_create_task',
    description: 'Create a new task .alp file in .alp/tasks/ with given title, description, and agent assignment.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title (used to derive the task id)' },
        description: { type: 'string', description: 'Optional task description' },
        agent: { type: 'string', description: 'Agent/role to assign (e.g. agent-qa)' },
        parent: { type: 'string', description: 'Optional parent task id' },
        status: { type: 'string', description: 'Initial status: [ ], [~], [x], [!], [?] (default [ ])' },
        cwd: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'alp_create_feature',
    description: 'Create a new feature .alp file in .alp/features/ with given title and description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Feature title (used to derive the feature id)' },
        description: { type: 'string', description: 'Optional feature description' },
        status: { type: 'string', description: 'Initial status: [ ], [~], [x], [!], [?] (default [ ])' },
        cwd: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'alp_set_status',
    description: 'Update the status of an ALP object (task, feature, etc.) by ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Object ID to update' },
        status: { type: 'string', description: 'New status: [ ], [~], [x], [!], [?]' },
        cwd: { type: 'string' }
      },
      required: ['id', 'status']
    }
  },
];

export function callTool(name: string, args: Record<string, any>, cwd: string) {
  switch (name) {
    case 'alp_update_status': {
      const targetId = args?.id as string;
      const newStatus = args?.status as string;
      const agent = args?.agent as string | undefined;
      const alpDir = path.join(cwd, '.alp');
      let updated = false;
      let policyError: ReturnType<typeof enforcePolicy> = null;
      const walk = (dir: string) => {
        if (updated || policyError) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (updated || policyError) return;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(fullPath);
          else if (fullPath.endsWith('.alp')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(`id: ${targetId}`)) {
              policyError = enforcePolicy(cwd, fullPath, agent);
              if (policyError) return;
              const { content: next, changed } = updateObjectStatus(content, targetId, newStatus);
              if (changed) {
                fs.writeFileSync(fullPath, next, 'utf8');
                updated = true;
              }
            }
          }
        }
      };
      if (fs.existsSync(alpDir)) walk(alpDir);

      if (policyError) return policyError;

      if (updated) {
        audit(cwd, 'task_status', { task_id: targetId, status: newStatus, agent });
      }
      return {
        content: [{ type: 'text', text: updated ? `Status of ${targetId} updated to ${newStatus}` : `Task ${targetId} not found` }]
      };
    }

    case 'alp_get_impact': {
      const objects = loadWorkspace(cwd);
      const graph = new AlpGraph();
      graph.buildGraph(objects);
      const targetId = args?.id as string;
      const impacted = graph.getImpact(targetId);
      return {
        content: [{ type: 'text', text: JSON.stringify(impacted.map(i => ({ id: i.id, type: i.type })), null, 2) }]
      };
    }

    case 'alp_decompose': {
      const parentId = args?.taskId as string;
      const subtasks = (args?.subtasks as string[] | undefined) || [];
      if (!parentId) {
        return { content: [{ type: 'text', text: 'Error: taskId is required.' }], isError: true };
      }
      if (subtasks.length === 0) {
        return { content: [{ type: 'text', text: 'Error: at least one subtask title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const tasksDir = path.join(alpDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });

      const created: string[] = [];
      for (const title of subtasks) {
        const id = toKebab(`${parentId}-${title}`);
        const file = path.join(tasksDir, `${id}.alp`);
        if (fs.existsSync(file)) continue;
        const denied = enforcePolicy(cwd, file, args?.agent as string | undefined);
        if (denied) return denied;
        const body =
          `!alp-version: 3.0.0\n\n` +
          `@task\n` +
          `  id: ${id}\n` +
          `  status: [ ]\n` +
          `  description: "${title.replace(/"/g, "'")}"\n` +
          `  depends_on:\n    - -> ${parentId}\n`;
        fs.writeFileSync(file, body, 'utf8');
        created.push(id);
      }
      if (created.length) {
        audit(cwd, 'file_mutation', { action: 'decompose', parent: parentId, created });
      }
      return {
        content: [{
          type: 'text',
          text: created.length
            ? `Decomposed ${parentId} into ${created.length} sub-task(s): ${created.join(', ')}`
            : `No new sub-tasks created (already exist).`,
        }],
      };
    }

    case 'alp_delegate': {
      const title = args?.title as string;
      const agent = (args?.agent as string) || 'agent-developer';
      const description = (args?.description as string) || title || '';
      const parent = args?.parent as string | undefined;
      const priority = (args?.priority as string) || 'medium';
      const tags = (args?.tags as string[] | undefined) || [];
      const skills = (args?.skills as string[] | undefined) || [];
      const dueDate = args?.dueDate as string | undefined;
      const context = args?.context as string | undefined;

      if (!title) {
        return { content: [{ type: 'text', text: 'Error: title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const tasksDir = path.join(alpDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });

      const id = toKebab(title);
      const file = path.join(tasksDir, `${id}.alp`);
      if (fs.existsSync(file)) {
        return { content: [{ type: 'text', text: `Task ${id} already exists.` }], isError: true };
      }
      const delegateDenied = enforcePolicy(cwd, file, agent);
      if (delegateDenied) return delegateDenied;

      const ownerLine = `  owner: -> ${agent.replace(/^->\s*/, '')}\n`;
      const parentLine = parent ? `  depends_on:\n    - -> ${parent.replace(/^->\s*/, '')}\n` : '';
      const priorityLine = `  priority: ${priority}\n`;
      const tagsLine = tags.length ? `  tags: [${tags.map(t => `"${t}"`).join(', ')}]\n` : '';
      const skillsLine = skills.length ? `  skills: [${skills.map(s => `"${s}"`).join(', ')}]\n` : '';
      const dueLine = dueDate ? `  due_date: "${dueDate}"\n` : '';
      const contextLine = context ? `  context: "${context.replace(/"/g, "'")}"\n` : '';

      const body =
        `!alp-version: 2.0.0\n\n` +
        `@task\n` +
        `  id: ${id}\n` +
        `  status: [ ]\n` +
        `  description: "${description.replace(/"/g, "'")}"\n` +
        ownerLine +
        priorityLine +
        tagsLine +
        skillsLine +
        dueLine +
        contextLine +
        parentLine;

      const validator = new DocumentValidator();
      try {
        validator.validate({ _type: 'task', id, status: '[ ]', description });
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Validation Error: ${err.message}` }], isError: true };
      }

      fs.writeFileSync(file, body, 'utf8');
      audit(cwd, 'file_mutation', { action: 'delegate', task_id: id, agent, priority, tags, skills });
      return {
        content: [{ type: 'text', text: `Delegated task ${id} to ${agent}.` }],
      };
    }

    case 'alp_create_task': {
      const title = args?.title as string;
      const description = (args?.description as string) || '';
      const agent = (args?.agent as string) || '';
      const parent = args?.parent as string | undefined;
      const status = (args?.status as string) || '[ ]';
      if (!title) {
        return { content: [{ type: 'text', text: 'Error: title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const tasksDir = path.join(alpDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });
      const id = toKebab(title);
      const file = path.join(tasksDir, `${id}.alp`);
      if (fs.existsSync(file)) {
        return { content: [{ type: 'text', text: `Task ${id} already exists.` }], isError: true };
      }
      const ownerLine = agent ? `  owner: -> ${agent}\n` : '';
      const parentLine = parent ? `  depends_on:\n    - -> ${parent}\n` : '';
      const body =
        `!alp-version: 2.0.0\n\n` +
        `@task\n` +
        `  id: ${id}\n` +
        `  status: ${status}\n` +
        `  description: "${description.replace(/"/g, "'")}"\n` +
        ownerLine +
        parentLine;
      fs.writeFileSync(file, body, 'utf8');
      audit(cwd, 'file_mutation', { action: 'create_task', task_id: id });
      return {
        content: [{ type: 'text', text: `Created task ${id}.` }],
      };
    }

    case 'alp_create_feature': {
      const title = args?.title as string;
      const description = (args?.description as string) || '';
      const status = (args?.status as string) || '[ ]';
      if (!title) {
        return { content: [{ type: 'text', text: 'Error: title is required.' }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const featuresDir = path.join(alpDir, 'features');
      fs.mkdirSync(featuresDir, { recursive: true });
      const id = toKebab(title);
      const file = path.join(featuresDir, `${id}.alp`);
      if (fs.existsSync(file)) {
        return { content: [{ type: 'text', text: `Feature ${id} already exists.` }], isError: true };
      }
      const body =
        `!alp-version: 2.0.0\n\n` +
        `@feature\n` +
        `  id: ${id}\n` +
        `  status: ${status}\n` +
        `  description: "${description.replace(/"/g, "'")}"\n`;
      fs.writeFileSync(file, body, 'utf8');
      audit(cwd, 'file_mutation', { action: 'create_feature', feature_id: id });
      return {
        content: [{ type: 'text', text: `Created feature ${id}.` }],
      };
    }

    case 'alp_set_status': {
      const targetId = args?.id as string;
      const newStatus = args?.status as string;
      if (!targetId || !newStatus) {
        return { content: [{ type: 'text', text: 'Error: id and status are required.' }], isError: true };
      }
      const objects = loadWorkspace(cwd);
      const obj = objects.find((o) => o.id === targetId);
      if (!obj) {
        return { content: [{ type: 'text', text: `Object ${targetId} not found.` }], isError: true };
      }
      const alpDir = path.join(cwd, '.alp');
      const filePath = path.join(alpDir, obj._type === 'task' ? 'tasks' : obj._type === 'feature' ? 'features' : 'objects', `${targetId}.alp`);
      if (!fs.existsSync(filePath)) {
        return { content: [{ type: 'text', text: `File for ${targetId} not found.` }], isError: true };
      }
      const content = fs.readFileSync(filePath, 'utf8');
      const updated = content.replace(/(status:\s*)\[.\]/, `$1${newStatus}`);
      fs.writeFileSync(filePath, updated, 'utf8');
      audit(cwd, 'task_status', { task_id: targetId, status: newStatus });
      return {
        content: [{ type: 'text', text: `Status of ${targetId} updated to ${newStatus}` }],
      };
    }

    default:
      return null;
  }
}

import fs from 'fs';
import path from 'path';

const TEMPLATES: Record<string, string> = {
  task: `@task
  id: {id}
  description: ""
  status: todo
  agent: ""
  depends_on: []`,

  agent: `@agent
  id: {id}
  description: ""
  model: ""
  capabilities: []
  tools: []`,

  workflow: `@workflow
  id: {id}
  description: ""
  steps: []
  triggers: []`,

  policy: `@policy
  id: {id}
  description: ""
  rules: []
  enforcement: warn`,

  test: `@test
  id: {id}
  description: ""
  command: ""
  expected: ""`,
};

export function templateCommand(type: string, id: string) {
  const targetDir = path.join(process.cwd(), '.alp');
  if (!fs.existsSync(targetDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const template = TEMPLATES[type];
  if (!template) {
    console.error(`Error: Unknown template type '${type}'.`);
    console.error(`Available types: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  const content = template.replace(/{id}/g, id);
  const filename = `${id}.alp`;
  const fullPath = path.join(targetDir, filename);

  if (fs.existsSync(fullPath)) {
    console.error(`Error: ${filename} already exists.`);
    process.exit(1);
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`Created ${filename} from ${type} template.`);
}

import fs from 'fs';
import path from 'path';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export interface InspectOptions {
  file?: string;
}

export function inspectCommand(objectId: string, options?: InspectOptions) {
  const cwd = process.cwd();
  const alpDir = options?.file ? path.dirname(options.file) : path.join(cwd, '.alp');
  const targetFile = options?.file || findFileWithId(alpDir, objectId);

  if (!targetFile) {
    console.error(`Error: Object '${objectId}' not found.`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const parser = new AlpParser();
  const objects = parser.parseAndValidate(content);
  const obj = objects.find((o: any) => o.id === objectId);

  if (!obj) {
    console.error(`Error: Object '${objectId}' not found in ${targetFile}.`);
    process.exit(1);
  }

  console.log(`\n📋 Object: ${obj.id}`);
  console.log(`   Type: @${obj._type}`);
  if (obj.description) console.log(`   Description: ${obj.description}`);
  if (obj.status) console.log(`   Status: ${obj.status}`);
  if (obj.agent) console.log(`   Agent: ${obj.agent}`);
  if (obj.depends_on) console.log(`   Depends on: ${Array.isArray(obj.depends_on) ? obj.depends_on.join(', ') : obj.depends_on}`);
  if (obj.references) console.log(`   References: ${Array.isArray(obj.references) ? obj.references.join(', ') : obj.references}`);
  if (obj.from) console.log(`   From: ${obj.from}`);
  if (obj.to) console.log(`   To: ${obj.to}`);
  if (obj.on_violation) console.log(`   On violation: ${obj.on_violation}`);
  if (obj.enforcement) console.log(`   Enforcement: ${obj.enforcement}`);
  if (obj.cron) console.log(`   Cron: ${obj.cron}`);
  if (obj.at) console.log(`   At: ${obj.at}`);
  if (obj.recipients) console.log(`   Recipients: ${(obj.recipients as any[])?.length || 0} configured`);
  if (obj.algorithm) console.log(`   Algorithm: ${obj.algorithm}`);
  if (obj.capabilities) console.log(`   Capabilities: ${(obj.capabilities as any[])?.length || 0} configured`);
  if (obj.model) console.log(`   Model: ${obj.model}`);
  if (obj.steps) console.log(`   Steps: ${(obj.steps as any[])?.length || 0}`);
  if (obj.triggers) console.log(`   Triggers: ${(obj.triggers as any[])?.length || 0}`);
  if (obj.rules) console.log(`   Rules: ${(obj.rules as any[])?.length || 0}`);
  console.log(`   File: ${targetFile}`);
  console.log('');
}

function findFileWithId(alpDir: string, objectId: string): string | null {
  if (!fs.existsSync(alpDir)) return null;
  const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
  for (const file of files) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(`id: ${objectId}`)) {
      return fullPath;
    }
  }
  return null;
}

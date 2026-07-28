import fs from 'fs';
import path from 'path';
import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

export interface SearchOptions {
  query?: string;
  type?: string;
  regex?: boolean;
}

export function searchCommand(options?: SearchOptions) {
  const cwd = process.cwd();
  const alpDir = path.join(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  const files = fs.readdirSync(alpDir).filter(f => f.endsWith('.alp'));
  for (const file of files) {
    const fullPath = path.join(alpDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    objects.push(...parser.parse(content));
  }

  const query = (options?.query || '').toLowerCase();
  if (!query) {
    console.error('Error: --query <text> is required.');
    process.exit(1);
  }

  const typeFilter = options?.type;
  let filtered = objects;
  if (typeFilter) {
    filtered = filtered.filter(o => o._type === typeFilter);
  }

  let results: AlpObject[];
  if (options?.regex) {
    try {
      const regex = new RegExp(query, 'i');
      results = filtered.filter(o =>
        (o.id && regex.test(o.id)) ||
        (o.description && regex.test(o.description)) ||
        JSON.stringify(o).match(regex)
      );
    } catch (err: any) {
      console.error(`Error: invalid regex: ${err.message}`);
      process.exit(1);
    }
  } else {
    results = filtered.filter(o =>
      (o.id && o.id.toLowerCase().includes(query)) ||
      (o.description && o.description.toLowerCase().includes(query))
    );
  }

  console.log(`\n🔍 Search Results (${results.length} match${results.length === 1 ? '' : 'es'})\n`);
  for (const obj of results) {
    const desc = obj.description ? ` — ${obj.description}` : '';
    console.log(`  • ${obj._type}:${obj.id}${desc}`);
  }
  console.log('');
}

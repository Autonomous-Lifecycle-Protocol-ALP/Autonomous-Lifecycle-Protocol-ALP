import * as fs from 'fs';
import * as path from 'path';

export interface Snippet {
  name: string;
  description?: string;
  template: Record<string, unknown>;
  tags?: string[];
}

const SNIPPETS_DIR = '.alp/snippets';

export class SnippetManager {
  private alpDir: string;
  private snippetsDir: string;
  private cache: Map<string, Snippet> = new Map();

  constructor(alpDir: string) {
    this.alpDir = alpDir;
    this.snippetsDir = path.join(alpDir, 'snippets');
    this.cache = this.loadAll();
  }

  private snippetPath(name: string): string {
    const safeName = name.replace(/[^a-z0-9_-]/gi, '_');
    return path.join(this.snippetsDir, `${safeName}.json`);
  }

  private loadAll(): Map<string, Snippet> {
    const map = new Map<string, Snippet>();
    if (!fs.existsSync(this.snippetsDir)) {
      return map;
    }
    const files = fs.readdirSync(this.snippetsDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(this.snippetsDir, file), 'utf8'));
        const snippet: Snippet = {
          name: raw.name ?? file.replace(/\.json$/, ''),
          description: raw.description,
          template: raw.template ?? {},
          tags: raw.tags,
        };
        map.set(snippet.name, snippet);
      } catch {
        continue;
      }
    }
    return map;
  }

  public list(): Snippet[] {
    return Array.from(this.cache.values());
  }

  public get(name: string): Snippet | undefined {
    return this.cache.get(name);
  }

  public getByTag(tag: string): Snippet[] {
    return this.list().filter((s) => s.tags?.includes(tag));
  }

  public save(snippet: Snippet): void {
    if (!snippet.name) {
      throw new Error('Snippet name is required');
    }
    this.cache.set(snippet.name, snippet);
    fs.mkdirSync(this.snippetsDir, { recursive: true });
    fs.writeFileSync(this.snippetPath(snippet.name), JSON.stringify(snippet, null, 2), 'utf8');
  }

  public remove(name: string): boolean {
    const existed = this.cache.delete(name);
    if (existed) {
      const file = this.snippetPath(name);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    return existed;
  }

  public validate(snippet: Partial<Snippet>): string[] {
    const errors: string[] = [];
    if (!snippet.name || snippet.name.trim().length === 0) {
      errors.push('Snippet name is required');
    }
    if (!snippet.template || Object.keys(snippet.template).length === 0) {
      errors.push('Snippet template is required');
    }
    return errors;
  }
}

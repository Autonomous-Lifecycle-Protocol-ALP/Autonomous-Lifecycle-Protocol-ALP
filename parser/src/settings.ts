import * as fs from 'fs';
import * as path from 'path';

export interface WorkspaceSettings {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  default_agent?: string;
  trusted_paths?: string[];
  excluded_paths?: string[];
  keyboard_shortcuts?: Record<string, string>;
}

export class SettingsManager {
  private alpDir: string;
  private settings: WorkspaceSettings;

  constructor(alpDir: string) {
    this.alpDir = alpDir;
    this.settings = this.load();
  }

  private settingsPath(): string {
    return path.join(this.alpDir, 'settings.json');
  }

  private load(): WorkspaceSettings {
    const file = this.settingsPath();
    if (!fs.existsSync(file)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  }

  public getAll(): WorkspaceSettings {
    return { ...this.settings };
  }

  public get<K extends keyof WorkspaceSettings>(key: K): WorkspaceSettings[K] | undefined {
    return this.settings[key];
  }

  public set<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]): void {
    this.settings[key] = value;
    this.persist();
  }

  public remove<K extends keyof WorkspaceSettings>(key: K): void {
    delete this.settings[key];
    this.persist();
  }

  public list(): Record<string, unknown> {
    return { ...this.settings };
  }

  public validate(): string[] {
    const errors: string[] = [];
    const validThemes = ['light', 'dark', 'system'];
    if (this.settings.theme && !validThemes.includes(this.settings.theme)) {
      errors.push(`Invalid theme: ${this.settings.theme}. Must be one of: ${validThemes.join(', ')}`);
    }
    if (this.settings.language && typeof this.settings.language !== 'string') {
      errors.push('language must be a string');
    }
    if (this.settings.default_agent && typeof this.settings.default_agent !== 'string') {
      errors.push('default_agent must be a string');
    }
    if (this.settings.trusted_paths && !Array.isArray(this.settings.trusted_paths)) {
      errors.push('trusted_paths must be an array of strings');
    }
    if (this.settings.excluded_paths && !Array.isArray(this.settings.excluded_paths)) {
      errors.push('excluded_paths must be an array of strings');
    }
    if (this.settings.keyboard_shortcuts && typeof this.settings.keyboard_shortcuts !== 'object') {
      errors.push('keyboard_shortcuts must be an object');
    }
    return errors;
  }

  private persist(): void {
    fs.mkdirSync(this.alpDir, { recursive: true });
    fs.writeFileSync(this.settingsPath(), JSON.stringify(this.settings, null, 2), 'utf8');
  }
}

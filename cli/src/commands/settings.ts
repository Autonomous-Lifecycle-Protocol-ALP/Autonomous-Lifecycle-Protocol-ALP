import fs from 'fs';
import path from 'path';

export interface SettingsOptions {
  get?: string;
  set?: string;
  value?: string;
  list?: boolean;
}

const SETTINGS_FILE = '.alp/settings.json';

function ensureAlpDir(cwd: string): string {
  const alpDir = path.join(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }
  return alpDir;
}

function readSettings(alpDir: string): Record<string, unknown> {
  const settingsPath = path.join(alpDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(alpDir: string, settings: Record<string, unknown>): void {
  const settingsPath = path.join(alpDir, 'settings.json');
  fs.mkdirSync(alpDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

export function settingsCommand(options?: SettingsOptions) {
  const cwd = process.cwd();
  const alpDir = ensureAlpDir(cwd);
  const settings = readSettings(alpDir);

  if (options?.list || (!options?.get && !options?.set)) {
    console.log('\n⚙️  Workspace Settings\n');
    if (Object.keys(settings).length === 0) {
      console.log('  (no settings configured)\n');
      return;
    }
    for (const [key, value] of Object.entries(settings)) {
      console.log(`  ${key} = ${JSON.stringify(value)}`);
    }
    console.log('');
    return;
  }

  if (options?.get) {
    const key = options.get;
    if (key in settings) {
      console.log(`${key} = ${JSON.stringify(settings[key])}`);
    } else {
      console.log(`Setting "${key}" is not defined.`);
      process.exit(1);
    }
    return;
  }

  if (options?.set && options?.value) {
    const key = options.set;
    let parsedValue: unknown = options.value;
    try {
      parsedValue = JSON.parse(options.value);
    } catch {
      // keep as string
    }
    settings[key] = parsedValue;
    writeSettings(alpDir, settings);
    console.log(`Set ${key} = ${JSON.stringify(parsedValue)}`);
    return;
  }

  console.error('Error: --get <key> or --set <key> <value> is required.');
  process.exit(1);
}

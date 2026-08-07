import { execSync } from 'child_process';

export interface GitOptions {
  status?: boolean;
  diff?: boolean;
  commit?: string;
  message?: string;
}

export function gitCommand(options?: GitOptions) {
  const cwd = process.cwd();

  if (options?.status || (!options?.diff && !options?.commit)) {
    runGit(['status', '--short'], 'git status');
    return;
  }

  if (options?.diff) {
    runGit(['diff', '--stat'], 'git diff');
    return;
  }

  if (options?.commit) {
    const msg = options?.message || options.commit;
    runGit(['add', '.'], 'git add');
    runGit(['commit', '-m', msg], 'git commit');
    return;
  }

  console.error('Error: --status, --diff, or --commit <message> is required.');
  process.exit(1);
}

function runGit(args: string[], label: string): void {
  try {
    const output = execSync('git', { cwd: process.cwd(), encoding: 'utf8' });
    console.log(`\n📋 ${label}`);
    console.log(output);
  } catch (err: any) {
    console.error(`Error running git: ${err.message}`);
    process.exit(1);
  }
}

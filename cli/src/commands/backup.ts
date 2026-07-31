import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export function backupCommand(action: string, target?: string) {
  const alpDir = path.join(process.cwd(), '.alp');
  const backupDir = path.join(process.cwd(), '.alp-backups');

  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
  }

  fs.mkdirSync(backupDir, { recursive: true });

  switch (action) {
    case 'create':
      handleCreate(alpDir, backupDir, target);
      break;
    case 'restore':
      if (!target) {
        console.error('Error: backup name is required for restore');
        process.exit(1);
      }
      handleRestore(alpDir, backupDir, target);
      break;
    case 'list':
      handleList(backupDir);
      break;
    default:
      console.error(`Usage: alp backup <create|restore|list> [name]`);
      process.exit(1);
  }
}

function handleCreate(alpDir: string, backupDir: string, name?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupName = name ? `${name}-${timestamp}` : `backup-${timestamp}`;
  const backupPath = path.join(backupDir, backupName);

  fs.mkdirSync(backupPath, { recursive: true });

  const files = fs.readdirSync(alpDir);
  for (const file of files) {
    const src = path.join(alpDir, file);
    const dest = path.join(backupPath, file);
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  console.log(`Backup created: ${backupName}`);
}

function handleRestore(alpDir: string, backupDir: string, name: string) {
  const backupPath = path.join(backupDir, name);

  if (!fs.existsSync(backupPath)) {
    console.error(`Error: Backup '${name}' not found in .alp-backups`);
    process.exit(1);
  }

  const files = fs.readdirSync(alpDir);
  for (const file of files) {
    const targetPath = path.join(alpDir, file);
    if (fs.statSync(targetPath).isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
  }

  const backupFiles = fs.readdirSync(backupPath);
  for (const file of backupFiles) {
    const src = path.join(backupPath, file);
    const dest = path.join(alpDir, file);
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  console.log(`Restored backup: ${name}`);
}

function handleList(backupDir: string) {
  if (!fs.existsSync(backupDir)) {
    console.log('No backups found.');
    return;
  }

  const backups = fs.readdirSync(backupDir);
  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log('\nAvailable backups:');
  for (const backup of backups) {
    const backupPath = path.join(backupDir, backup);
    const stats = fs.statSync(backupPath);
    const size = getDirectorySize(backupPath);
    console.log(`  ${backup} (${formatBytes(size)})`);
  }
}

function getDirectorySize(dir: string): number {
  let total = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      total += getDirectorySize(filePath);
    } else {
      total += stats.size;
    }
  }
  return total;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

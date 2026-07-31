import fs from 'fs';
import path from 'path';

export function diffCommand(nameA: string, nameB: string) {
  const snapshotDir = path.join(process.cwd(), '.alp', '.snapshots');

  if (!fs.existsSync(snapshotDir)) {
    console.error('Error: No snapshots directory found. Run `alp backup create` first.');
    process.exit(1);
  }

  const pathA = path.join(snapshotDir, `${nameA}.json`);
  const pathB = path.join(snapshotDir, `${nameB}.json`);

  if (!fs.existsSync(pathA)) {
    console.error(`Error: Snapshot '${nameA}' not found.`);
    process.exit(1);
  }
  if (!fs.existsSync(pathB)) {
    console.error(`Error: Snapshot '${nameB}' not found.`);
    process.exit(1);
  }

  const payloadA = JSON.parse(fs.readFileSync(pathA, 'utf-8'));
  const payloadB = JSON.parse(fs.readFileSync(pathB, 'utf-8'));

  const objsA = indexObjects((payloadA.objects ?? []));
  const objsB = indexObjects((payloadB.objects ?? []));

  const idsA = new Set(objsA.keys());
  const idsB = new Set(objsB.keys());

  const added = [...idsB].filter(id => !idsA.has(id)).sort();
  const removed = [...idsA].filter(id => !idsB.has(id)).sort();
  const modified = [...idsA].filter(id => {
    if (!idsB.has(id)) return false;
    return JSON.stringify(objsA.get(id)) !== JSON.stringify(objsB.get(id));
  }).sort();

  console.log(`\nDiff: ${nameA} → ${nameB}`);
  console.log(`  Added:   ${added.length}`);
  console.log(`  Removed: ${removed.length}`);
  console.log(`  Modified: ${modified.length}`);

  if (added.length > 0) {
    console.log('\n  + Added:');
    for (const id of added) {
      console.log(`    + ${id}`);
    }
  }
  if (removed.length > 0) {
    console.log('\n  - Removed:');
    for (const id of removed) {
      console.log(`    - ${id}`);
    }
  }
  if (modified.length > 0) {
    console.log('\n  ~ Modified:');
    for (const id of modified) {
      console.log(`    ~ ${id}`);
    }
  }

  if (!added.length && !removed.length && !modified.length) {
    console.log('\n  No differences found.');
  }
}

function indexObjects(objects: Array<Record<string, unknown>>): Map<string, Record<string, unknown>> {
  const map = new Map();
  for (const obj of objects) {
    const key = (obj.id as string) || (obj._type as string) || JSON.stringify(obj);
    map.set(key, obj);
  }
  return map;
}

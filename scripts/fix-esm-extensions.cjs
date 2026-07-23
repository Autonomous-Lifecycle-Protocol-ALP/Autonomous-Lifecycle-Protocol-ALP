const fs = require('fs');
const path = require('path');

const targets = [
  'C:/Users/KGN/Desktop/new file sys/parser/dist',
  'C:/Users/KGN/Desktop/new file sys/cli/dist',
];

const BUFFER_SHIM_PATH = 'C:/Users/KGN/Desktop/new file sys/scripts/__buffer-shim-tpl.js';
const BUFFER_SHIM_CONTENT = fs.readFileSync(BUFFER_SHIM_PATH, 'utf8');
const BUFFER_IMPORT = "import Buffer from './buffer.js';\n";

function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function fixJs(code, needsBufferImport) {
  code = code.replace(
    /(?<=from\s+['"])(\.[^'"]+)(?=['"])/g,
    (match, p1) => (p1.endsWith('.js') ? match : `${p1}.js`)
  );
  if (needsBufferImport && !code.includes("import Buffer from './buffer.js'") && !code.includes("import * as Buffer") && /\bBuffer\.[a-zA-Z]/.test(code)) {
    code = BUFFER_IMPORT + code;
  }
  return code;
}

function fixDts(code) {
  return code.replace(
    /(?<=from\s+['"])(\.[^'"]+)(?=['"])/g,
    (match, p1) => (p1.endsWith('.d.ts') ? match : `${p1}.d.ts`)
  );
}

let count = 0;
for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;
  const isParser = dir.endsWith('parser/dist');

  if (isParser) {
    const bufferDest = path.join(dir, 'buffer.js');
    if (!fs.existsSync(bufferDest)) {
      fs.writeFileSync(bufferDest, BUFFER_SHIM_CONTENT);
      count++;
    }
  }

  const files = walk(dir).filter(f => f.endsWith('.js') || f.endsWith('.d.ts'));
  for (const full of files) {
    const file = path.basename(full);
    let code = fs.readFileSync(full, 'utf8');
    const original = code;

    if (file.endsWith('.js')) {
      code = fixJs(code, !isParser);
    } else if (file.endsWith('.d.ts')) {
      code = fixDts(code);
    }

    if (code !== original) {
      fs.writeFileSync(full, code, 'utf8');
      count++;
    }
  }
}
console.log(`Patched ${count} files across ${targets.length} dist directories`);

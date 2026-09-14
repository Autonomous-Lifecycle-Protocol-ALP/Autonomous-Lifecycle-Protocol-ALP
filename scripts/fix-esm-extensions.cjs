const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = path.resolve(__dirname, '..');
const PARSER_DIST = path.join(SCRIPT_DIR, 'parser', 'dist');
const CLI_DIST = path.join(SCRIPT_DIR, 'cli', 'dist');

const targets = [
  PARSER_DIST,
  CLI_DIST,
];

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

function fixJs(code, fullPath) {
  const dir = path.dirname(fullPath);
  return code.replace(
    /(?<=from\s+['"])(\.[^'"]+)(?=['"])/g,
    (match, p1) => {
      if (p1.endsWith('.js')) return match;
      try {
        const fileTarget = path.resolve(dir, `${p1}.js`);
        if (fs.existsSync(fileTarget) && fs.statSync(fileTarget).isFile()) {
          return `${p1}.js`;
        }
        const dirTarget = path.resolve(dir, p1);
        if (fs.existsSync(dirTarget) && fs.statSync(dirTarget).isDirectory()) {
          return `${p1}/index.js`;
        }
      } catch {}
      return `${p1}.js`;
    }
  );
}

function fixDts(code, fullPath) {
  const dir = path.dirname(fullPath);
  return code.replace(
    /(?<=from\s+['"])(\.[^'"]+)(?=['"])/g,
    (match, p1) => {
      if (p1.endsWith('.d.ts')) return match;
      try {
        const fileTarget = path.resolve(dir, `${p1}.d.ts`);
        if (fs.existsSync(fileTarget) && fs.statSync(fileTarget).isFile()) {
          return `${p1}.d.ts`;
        }
        const dirTarget = path.resolve(dir, p1);
        if (fs.existsSync(dirTarget) && fs.statSync(dirTarget).isDirectory()) {
          return `${p1}/index.d.ts`;
        }
      } catch {}
      return `${p1}.d.ts`;
    }
  );
}

let count = 0;
for (const dir of targets) {
  if (!fs.existsSync(dir)) continue;

  const files = walk(dir).filter(f => f.endsWith('.js') || f.endsWith('.d.ts'));
  for (const full of files) {
    const file = path.basename(full);
    let code = fs.readFileSync(full, 'utf8');
    const original = code;

    if (file.endsWith('.js')) {
      code = fixJs(code, full);
    } else if (file.endsWith('.d.ts')) {
      code = fixDts(code, full);
    }

    if (code !== original) {
      fs.writeFileSync(full, code, 'utf8');
      count++;
    }
  }
}
console.log(`Patched ${count} files across ${targets.length} dist directories`);

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'cli', 'src', 'commands');

// Map of emoji patterns to their text replacements
const replacements = [
  [/✅/g, '[OK]'],
  [/❌/g, '[FAIL]'],
  [/🔒/g, '[LOCK]'],
  [/🔐/g, '[LOCK]'],
  [/🔓/g, '[UNLOCK]'],
  [/🚀/g, '[START]'],
  [/🎉/g, '[DONE]'],
  [/🧪/g, '[TEST]'],
  [/📄/g, '[FILE]'],
  [/📊/g, '[STATS]'],
  [/📈/g, '[STATS]'],
  [/📡/g, '[SIGNAL]'],
  [/📭/g, '[EMPTY]'],
  [/🔍/g, '[SCAN]'],
  [/🔬/g, '[VERIFY]'],
  [/🧠/g, '[BRAIN]'],
  [/⚡/g, '[FAST]'],
  [/⚠️\s?/g, '[WARN] '],
  [/⚠/g, '[WARN]'],
  [/⛔/g, '[BLOCK]'],
  [/🚨/g, '[ALERT]'],
  [/🏢/g, '[ORG]'],
  [/👋/g, '[EXIT]'],
  [/🤖/g, '[BOT]'],
  [/🔗/g, '[LINK]'],
  [/🟢/g, '[UP]'],
  [/🟡/g, '[WARN]'],
  [/🔴/g, '[DOWN]'],
  [/💡/g, '[TIP]'],
  [/💾/g, '[SAVE]'],
  [/💀/g, '[DEAD]'],
  [/🛡️?/g, '[SHIELD]'],
  [/🔥/g, '[HOT]'],
  [/📦/g, '[PKG]'],
  [/🌐/g, '[NET]'],
  [/🔧/g, '[FIX]'],
  [/🔨/g, '[BUILD]'],
  [/📝/g, '[NOTE]'],
  [/⏱️?/g, '[TIME]'],
  [/🏷️?/g, '[TAG]'],
  [/🆕/g, '[NEW]'],
  [/📋/g, '[LIST]'],
  [/🗑️?/g, '[DEL]'],
  [/🔄/g, '[SYNC]'],
  [/✨/g, '[NEW]'],
  [/🛠️?/g, '[TOOL]'],
  [/🏗️?/g, '[BUILD]'],
  [/💬/g, '[MSG]'],
  [/📁/g, '[DIR]'],
  [/🔌/g, '[PLUG]'],
  [/📖/g, '[DOC]'],
  [/🧩/g, '[PLUGIN]'],
  [/⬆️?/g, '[UP]'],
  [/⬇️?/g, '[DOWN]'],
  [/➡️?/g, '->'],
  [/🎯/g, '[TARGET]'],
  [/🪄/g, '[AUTO]'],
  [/🧬/g, '[DNA]'],
  [/🌀/g, '[CYCLE]'],
  [/💥/g, '[CRASH]'],
  [/🔮/g, '[PREDICT]'],
  [/🧵/g, '[THREAD]'],
  [/🪢/g, '[KNOT]'],
  [/🏆/g, '[WIN]'],
  [/🎓/g, '[LEARN]'],
  [/🌊/g, '[WAVE]'],
  [/🔋/g, '[POWER]'],
  [/📐/g, '[CALC]'],
  [/🧮/g, '[CALC]'],
  [/🔀/g, '[MERGE]'],
  [/🎲/g, '[RAND]'],
  [/🛑/g, '[STOP]'],
  [/🏁/g, '[FINISH]'],
  [/📢/g, '[ANNOUNCE]'],
  [/🪙/g, '[COIN]'],
  [/💎/g, '[GEM]'],
  [/🗂️?/g, '[INDEX]'],
  [/📌/g, '[PIN]'],
  [/🧹/g, '[CLEAN]'],
  [/📍/g, '[LOC]'],
  [/🎨/g, '[STYLE]'],
  [/🏠/g, '[HOME]'],
  [/🌍/g, '[GLOBAL]'],
  [/🕐/g, '[CLOCK]'],
];

let totalFiles = 0;
let totalReplacements = 0;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;

  for (const [pattern, replacement] of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(pattern, replacement);
    }
  }

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFiles++;
    totalReplacements += fileReplacements;
    console.log(`  [FIXED] ${file} (${fileReplacements} replacements)`);
  }
}

console.log(`\n[DONE] Fixed ${totalReplacements} emoji occurrences across ${totalFiles} files.`);

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'commercial', 'enterprise-app', 'src');

const iconMap = {
  '🧪': { comp: 'FiBox', pkg: 'fi' },
  '📈': { comp: 'FiTrendingUp', pkg: 'fi' },
  '📤': { comp: 'FiUpload', pkg: 'fi' },
  '⏱': { comp: 'FiClock', pkg: 'fi' },
  '🚨': { comp: 'FiAlertCircle', pkg: 'fi' },
  '✨': { comp: 'FiStar', pkg: 'fi' },
  '🐛': { comp: 'FaBug', pkg: 'fa' },
  '⚡': { comp: 'FiZap', pkg: 'fi' },
  '✦': { comp: 'FiStar', pkg: 'fi' },
  '📸': { comp: 'FiCamera', pkg: 'fi' },
  '🔍': { comp: 'FiSearch', pkg: 'fi' },
  '🔄': { comp: 'FiRefreshCw', pkg: 'fi' },
  '✓': { comp: 'FiCheck', pkg: 'fi' },
  '★': { comp: 'FiStar', pkg: 'fi' },
  '💾': { comp: 'FiSave', pkg: 'fi' },
  '▶': { comp: 'FiPlay', pkg: 'fi' },
  '🔥': { comp: 'FaFire', pkg: 'fa' },
  '✕': { comp: 'FiX', pkg: 'fi' },
  '📴': { comp: 'FiSmartphone', pkg: 'fi' },
  '➜': { comp: 'FiArrowRight', pkg: 'fi' },
  '🚀': { comp: 'FiSend', pkg: 'fi' },
  '⚛': { comp: 'FaReact', pkg: 'fa' },
  '🔗': { comp: 'FiLink', pkg: 'fi' },
  '📋': { comp: 'FiClipboard', pkg: 'fi' },
  '📡': { comp: 'FiRadio', pkg: 'fi' },
  '🔐': { comp: 'FiLock', pkg: 'fi' }
};

function processFiles(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processFiles(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const usedIcons = { fi: new Set(), fa: new Set() };
      let changed = false;

      for (const [emoji, info] of Object.entries(iconMap)) {
        if (content.includes(emoji)) {
          // Replace emoji with just the component name for now
          // If it's alone in quotes like "🚀", we want to turn it into a component reference
          // e.g. icon: "🚀" -> icon: FiSend
          content = content.replace(new RegExp(`"\\s*${emoji}\\s*"`, 'g'), info.comp);
          content = content.replace(new RegExp(`'\\s*${emoji}\\s*'`, 'g'), info.comp);
          
          // For JSX text or strings with other text
          content = content.replace(new RegExp(emoji, 'g'), `<${info.comp} className='inline-block mr-1' />`);
          usedIcons[info.pkg].add(info.comp);
          changed = true;
        }
      }

      if (changed) {
        // Add imports safely
        let importStatements = "";
        if (usedIcons.fi.size > 0) {
          importStatements += `import { ${[...usedIcons.fi].join(', ')} } from 'react-icons/fi';\n`;
        }
        if (usedIcons.fa.size > 0) {
          importStatements += `import { ${[...usedIcons.fa].join(', ')} } from 'react-icons/fa';\n`;
        }
        
        content = importStatements + content;
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processFiles(dir);
console.log('Replacement complete.');

const path = require('path');
const mainPath = path.join(__dirname, 'index.js');

try {
  require(mainPath);
} catch (err) {
  console.error('Failed to load main process:', err);
  process.exit(1);
}

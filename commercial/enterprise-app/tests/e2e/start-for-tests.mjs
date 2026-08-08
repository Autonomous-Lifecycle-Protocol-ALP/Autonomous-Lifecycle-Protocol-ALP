import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const alpServerDir = path.resolve(__dirname, '../../../alp-server');
const enterpriseAppDir = path.resolve(__dirname, '../..');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

async function startServers() {
  const alpServerRunning = await isPortInUse(5000);
  
  if (!alpServerRunning) {
    const scriptPath = path.join(alpServerDir, 'scripts', 'start-dev.js');
    const alpServer = spawn(process.execPath, [scriptPath], {
      cwd: alpServerDir,
      stdio: 'inherit',
    });

    alpServer.on('error', (err) => {
      console.error('Failed to start alp-server:', err);
      process.exit(1);
    });

    await new Promise(resolve => setTimeout(resolve, 5000));
  } else {
    console.log('ALP server already running on port 5000');
  }

  const vitePath = path.join(enterpriseAppDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const enterpriseApp = spawn(process.execPath, [vitePath], {
    cwd: enterpriseAppDir,
    stdio: 'inherit',
  });

  enterpriseApp.on('error', (err) => {
    console.error('Failed to start enterprise-app:', err);
    process.exit(1);
  });
}

startServers();

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

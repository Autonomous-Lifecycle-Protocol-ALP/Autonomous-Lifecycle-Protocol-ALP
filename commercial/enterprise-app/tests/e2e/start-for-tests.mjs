import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const alpServerDir = path.resolve(__dirname, '../../alp-server');
const enterpriseAppDir = __dirname;
const isWindows = os.platform() === 'win32';
const shellOption = isWindows ? 'powershell.exe' : true;

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
    const alpServer = spawn('npm', ['run', 'dev:mongo'], {
      cwd: alpServerDir,
      shell: shellOption,
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

  const enterpriseApp = spawn('npm', ['run', 'dev'], {
    cwd: enterpriseAppDir,
    shell: shellOption,
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

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

function waitForPort(port, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      isPortInUse(port).then((inUse) => {
        if (inUse) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for port ${port}`));
        setTimeout(check, 500);
      });
    };
    check();
  });
}

async function startMockServer() {
  console.log('Starting mock ALP server...');
  const scriptPath = path.join(__dirname, 'mock-server.mjs');
  const mockServer = spawn(process.execPath, [scriptPath], {
    cwd: enterpriseAppDir,
    stdio: 'inherit',
  });

  mockServer.on('error', (err) => {
    console.error('Failed to start mock server:', err);
    process.exit(1);
  });

  await waitForPort(5000, 15000);
  console.log('Mock ALP server ready on port 5000');
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
    });

    try {
      await waitForPort(5000, 20000);
      console.log('ALP server ready on port 5000');
    } catch (err) {
      console.warn('ALP server failed to start, falling back to mock server:', err.message);
      await startMockServer();
    }
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

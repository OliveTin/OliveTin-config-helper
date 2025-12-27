import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

export class ServiceManager {
  constructor(options = {}) {
    this.port = options.port || '9486';
    this.staticDir = options.staticDir || join(projectRoot, 'frontend/dist');
    this.process = null;
    this.logLevel = options.logLevel || 'error';
    this.configDir = options.configDir || null;
  }

  async start() {
    if (this.process) {
      throw new Error('Service is already running');
    }

    const binaryPath = join(projectRoot, 'service/OliveTin-config-helper');
    
    if (!existsSync(binaryPath)) {
      throw new Error(`Binary not found at ${binaryPath}. Please build the service first.`);
    }

    const env = {
      ...process.env,
      PORT: this.port,
      STATIC_DIR: this.staticDir,
      LOG_LEVEL: this.logLevel,
    };

    const args = [];
    if (this.configDir) {
      args.push('-configdir', this.configDir);
    }

    return new Promise((resolve, reject) => {
      this.process = spawn(binaryPath, args, {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';
      let resolved = false;

      const checkReady = () => {
        if (!resolved && output.includes('Starting OliveTin-config-helper')) {
          resolved = true;
          setTimeout(resolve, 500);
        }
      };

      this.process.stdout.on('data', (data) => {
        output += data.toString();
        checkReady();
      });

      this.process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      this.process.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Failed to start service: ${err.message}`));
        }
      });

      this.process.on('exit', (code) => {
        if (code !== 0 && code !== null && !resolved) {
          resolved = true;
          reject(new Error(`Service exited with code ${code}. Output: ${output}\nErrors: ${errorOutput}`));
        }
      });

      setTimeout(() => {
        if (!resolved && this.process && !this.process.killed) {
          resolved = true;
          resolve();
        }
      }, 3000);
    });
  }

  async stop() {
    if (!this.process) {
      return;
    }

    return new Promise((resolve) => {
      this.process.on('exit', () => {
        this.process = null;
        resolve();
      });

      this.process.kill('SIGTERM');

      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });
  }

  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }
}


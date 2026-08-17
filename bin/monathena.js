#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appPath = path.join(rootDir, 'src', 'app.tsx');

const args = [appPath, ...process.argv.slice(2)];

const child = spawn('npx', ['tsx', ...args], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PI_CODING_AGENT_DIR: path.resolve(rootDir, '.pi', 'agent')
  }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

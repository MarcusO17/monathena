import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

function pingOllama(url: string = 'http://127.0.0.1:11434/api/tags'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function ensureOllamaRunning(): Promise<boolean> {
  const isRunning = await pingOllama();
  if (isRunning) {
    return true;
  }

  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\User', 'AppData', 'Local');
  const ollamaAppExe = path.join(localAppData, 'Programs', 'Ollama', 'ollama app.exe');
  const ollamaCliExe = path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe');

  let launched = false;

  if (fs.existsSync(ollamaAppExe)) {
    try {
      const subprocess = spawn(ollamaAppExe, [], {
        detached: true,
        stdio: 'ignore'
      });
      subprocess.unref();
      launched = true;
    } catch {}
  }

  if (!launched && fs.existsSync(ollamaCliExe)) {
    try {
      const subprocess = spawn(ollamaCliExe, ['serve'], {
        detached: true,
        stdio: 'ignore'
      });
      subprocess.unref();
      launched = true;
    } catch {}
  }

  if (!launched) {
    try {
      const subprocess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      subprocess.unref();
      launched = true;
    } catch {}
  }

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const ready = await pingOllama();
    if (ready) {
      return true;
    }
  }

  return false;
}

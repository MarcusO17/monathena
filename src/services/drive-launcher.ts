import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';

export async function ensureGoogleDriveMounted(targetPath: string = 'H:\\My Drive'): Promise<boolean> {
  if (fs.existsSync(targetPath)) {
    return true;
  }

  console.log(`\x1b[36m[Google Drive] Drive not mounted at ${targetPath}. Launching Google Drive...\x1b[0m`);

  const searchRoots = [
    'C:\\Program Files\\Google\\Drive File Stream',
    'C:\\Program Files\\Google\\Drive',
    'C:\\Program Files (x86)\\Google\\Drive File Stream',
    'C:\\Program Files (x86)\\Google\\Drive'
  ];

  let driveExe: string | null = null;

  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      const launchBat = path.join(root, 'launch.bat');
      if (fs.existsSync(launchBat)) {
        driveExe = launchBat;
        break;
      }
      try {
        const subdirs = fs.readdirSync(root);
        for (const sub of subdirs) {
          const exePath = path.join(root, sub, 'GoogleDriveFS.exe');
          if (fs.existsSync(exePath)) {
            driveExe = exePath;
            break;
          }
        }
      } catch {}
      if (driveExe) break;
    }
  }

  if (driveExe) {
    try {
      const subprocess = spawn(driveExe, [], {
        detached: true,
        stdio: 'ignore'
      });
      subprocess.unref();
    } catch (err: any) {
      console.warn(`\x1b[33m[Google Drive] Failed to launch ${driveExe}: ${err.message}\x1b[0m`);
    }
  } else {
    try {
      exec('start "" "GoogleDriveFS.exe"', () => {});
    } catch {}
  }

  // Poll for up to 10 seconds for Google Drive to mount
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (fs.existsSync(targetPath)) {
      console.log(`\x1b[32m[Google Drive] 🟢 Google Drive mounted successfully at ${targetPath}!\x1b[0m\n`);
      return true;
    }
  }

  if (fs.existsSync(targetPath)) {
    return true;
  }

  console.warn(`\x1b[33m[Google Drive] ⚠️ Google Drive not yet mounted at ${targetPath}.\x1b[0m\n`);
  return false;
}

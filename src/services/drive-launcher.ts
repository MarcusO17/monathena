import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';

export async function ensureGoogleDriveMounted(targetPath: string = 'H:\\My Drive'): Promise<boolean> {
  if (fs.existsSync(targetPath)) {
    return true;
  }

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
    } catch {}
  } else {
    try {
      exec('start "" "GoogleDriveFS.exe"', () => {});
    } catch {}
  }

  // Poll for up to 10 seconds for Google Drive to mount
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (fs.existsSync(targetPath)) {
      return true;
    }
  }

  return fs.existsSync(targetPath);
}

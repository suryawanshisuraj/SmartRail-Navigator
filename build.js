import { execSync } from 'child_process';
import fs from 'fs';

console.log('[Build] Current directory:', process.cwd());

if (fs.existsSync('frontend')) {
  console.log('[Build] Building frontend from project root...');
  execSync('npm install --prefix frontend', { stdio: 'inherit' });
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });

  if (fs.existsSync('frontend/dist')) {
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.cpSync('frontend/dist', 'dist', { recursive: true });
    console.log('[Build] Successfully copied frontend/dist to ./dist');
  }
} else {
  console.log('[Build] Running in frontend directory directly...');
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('[Build] SmartRail Navigator build completed.');

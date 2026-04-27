const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('📁 Project root:', PROJECT_ROOT);
console.log('🚀 Starting Express server...');

const express = spawn('node', ['dist/index.cjs'], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, NODE_ENV: 'production' },
});

express.on('error', (err) => {
  console.error('❌ Express failed to start:', err);
  process.exit(1);
});

express.on('close', (code) => {
  console.log('Express exited with code', code);
  process.exit(code);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  express.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  express.kill();
  process.exit(0);
});


const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');

console.log('📁 Project root:', PROJECT_ROOT);
console.log('📁 Backend dir:', BACKEND_DIR);
console.log('🗄️  Running Django migrations...');

// Run migrations first
const migrate = spawn('python3', ['manage.py', 'migrate', '--run-syncdb'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  shell: true,
});

migrate.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Migration failed with code:', code);
    process.exit(1);
  }

  console.log('✅ Migrations complete');
  console.log('⏳ Starting Django backend...');

  // Start Django
  const django = spawn('python3', ['-m', 'gunicorn', 'dental_care.wsgi:application', '--bind', '0.0.0.0:8000', '--workers', '4', '--timeout', '120', '--access-logfile', '-', '--error-logfile', '-'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });

  django.on('error', (err) => {
    console.error('❌ Django failed to start:', err);
    process.exit(1);
  });

  // Wait for Django to start
  console.log('⏸️  Waiting for Django to be ready...');
  let attempts = 0;
  
  const checkDjango = () => {
    const req = http.get('http://127.0.0.1:8000/', (res) => {
      console.log('✅ Django is ready! (HTTP ' + res.statusCode + ')');
      startExpress();
      req.abort();
    });

    req.on('error', () => {
      attempts++;
      if (attempts < 30) {
        setTimeout(checkDjango, 500);
      } else {
        console.log('⚠️  Django startup verification timed out (30 attempts), starting Express anyway...');
        startExpress();
      }
    });

    req.setTimeout(500, () => {
      req.abort();
    });
  };

  const startExpress = () => {
    console.log('🚀 Starting Express server...');
    
    const express = spawn('node', ['dist/index.cjs'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, NODE_ENV: 'production' },
    });

    express.on('error', (err) => {
      console.error('❌ Express failed to start:', err);
      django.kill();
      process.exit(1);
    });

    express.on('close', (code) => {
      console.log('Express exited with code', code);
      django.kill();
      process.exit(code);
    });
  };

  setTimeout(checkDjango, 2000);

  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    django.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    django.kill();
    process.exit(0);
  });
});

migrate.on('error', (err) => {
  console.error('❌ Migration process failed:', err);
  process.exit(1);
});


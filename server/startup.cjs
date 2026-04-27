const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('📁 Project root:', PROJECT_ROOT);
console.log('� Checking for Python...');

// Try to detect if Python is available
const checkPython = spawn('which', ['python3'], {
  shell: true,
  stdio: 'pipe'
});

let pythonAvailable = false;

checkPython.on('close', (code) => {
  pythonAvailable = code === 0;
  
  if (pythonAvailable) {
    console.log('✅ Python found! Starting Django...');
    startDjango();
  } else {
    console.log('⚠️  Python not found. Django will NOT run.');
    console.log('📝 Set DJANGO_HOST and DJANGO_PORT env vars to point to external Django backend');
    console.log('🚀 Starting Express server only...');
    startExpress();
  }
});

const startDjango = () => {
  const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
  console.log('📦 Installing Python dependencies...');
  
  const pip = spawn('pip3', ['install', '-q', '-r', 'requirements.txt'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true
  });
  
  pip.on('close', (code) => {
    if (code !== 0) {
      console.warn('⚠️  Failed to install Python deps, continuing anyway...');
    }
    
    console.log('🗄️  Running Django migrations...');
    const migrate = spawn('python3', ['manage.py', 'migrate', '--run-syncdb'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      shell: true
    });
    
    migrate.on('close', (migCode) => {
      console.log('⏳ Starting Django backend...');
      const django = spawn('python3', ['-m', 'gunicorn', 'dental_care.wsgi:application', '--bind', '127.0.0.1:8000', '--workers', '2', '--timeout', '60', '--access-logfile', '-'], {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
        shell: true
      });
      
      django.on('error', (err) => {
        console.error('❌ Django failed:', err);
      });
      
      global.djangoProcess = django;
      
      // Start Express after a short delay
      setTimeout(() => {
        console.log('🚀 Starting Express server...');
        startExpress();
      }, 2000);
    });
  });
};

const startExpress = () => {
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
    if (global.djangoProcess) global.djangoProcess.kill();
    process.exit(code);
  });
};

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (global.djangoProcess) global.djangoProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  if (global.djangoProcess) global.djangoProcess.kill();
  process.exit(0);
});


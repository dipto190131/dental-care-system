const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('Project root:', PROJECT_ROOT);
console.log('Environment:', process.env.NODE_ENV || 'development');

// On Render: only run Express (Django runs separately)
// On Local/Railway: try to start Django if Python available
const isDjangoHost = process.env.DJANGO_HOST === '127.0.0.1' || 
                     process.env.DJANGO_HOST === 'localhost' || 
                     !process.env.DJANGO_HOST;

if (isDjangoHost) {
  console.log('Checking for Python...');
  const checkPython = spawn('which', ['python3'], {
    shell: true,
    stdio: 'pipe'
  });

  checkPython.on('close', (code) => {
    if (code === 0) {
      console.log('Python found! Attempting to start Django...');
      startDjango();
    } else {
      console.log('Warning: Python not found. Django will NOT run.');
      console.log('For Render: Set DJANGO_HOST and DJANGO_PORT to backend service URL');
      startExpressOnly();
    }
  });
} else {
  console.log('Using remote Django backend:', process.env.DJANGO_HOST);
  startExpressOnly();
}

const startDjango = () => {
  const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
  console.log('Installing Python dependencies...');
  
  const pip = spawn('pip3', ['install', '-q', '-r', 'requirements.txt'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true
  });
  
  pip.on('close', (code) => {
    if (code !== 0) {
      console.warn('Warning: Failed to install Python deps, continuing anyway...');
    }
    
    console.log('Running Django migrations...');
    const migrate = spawn('python3', ['manage.py', 'migrate', '--run-syncdb'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      shell: true
    });
    
    migrate.on('close', () => {
      console.log('Starting Django backend...');
      const django = spawn('python3', ['-m', 'gunicorn', 'dental_care.wsgi:application', '--bind', '127.0.0.1:8000', '--workers', '2', '--timeout', '60', '--access-logfile', '-'], {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
        shell: true
      });
      
      django.on('error', (err) => {
        console.error('Django error:', err.message);
      });
      
      global.djangoProcess = django;
      
      // Start Express after delay
      setTimeout(() => {
        startExpressOnly();
      }, 2000);
    });
  });
};

const startExpressOnly = () => {
  console.log('Starting Express server...');
  
  const express = spawn('node', ['dist/index.cjs'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, NODE_ENV: 'production' },
  });

  express.on('error', (err) => {
    console.error('Express error:', err.message);
    process.exit(1);
  });

  express.on('close', (code) => {
    console.log('Express exited with code', code);
    if (global.djangoProcess) global.djangoProcess.kill();
    process.exit(code);
  });
};

// Cleanup
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

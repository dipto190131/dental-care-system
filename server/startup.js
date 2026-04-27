const { spawn } = require('child_process');
const http = require('http');

console.log('🗄️  Running Django migrations...');

// Run migrations first
const migrate = spawn('python', ['backend/manage.py', 'migrate', '--run-syncdb'], {
  stdio: 'inherit',
  shell: true,
});

migrate.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Migration failed!');
    process.exit(1);
  }

  console.log('✅ Migrations complete');
  console.log('⏳ Starting Django backend...');

  // Start Django
  const django = spawn('python', ['-m', 'gunicorn', 'dental_care.wsgi:application', '--bind', '0.0.0.0:8000', '--workers', '4', '--timeout', '120', '--access-logfile', '-', '--error-logfile', '-'], {
    cwd: 'backend',
    stdio: 'inherit',
    shell: true,
  });

  django.on('error', (err) => {
    console.error('❌ Django failed to start:', err);
    process.exit(1);
  });

  // Wait a bit for Django to start
  console.log('⏸️  Waiting for Django to be ready...');
  setTimeout(() => {
    // Check if Django is responding
    let attempts = 0;
    const checkDjango = () => {
      const req = http.get('http://127.0.0.1:8000/api/health', (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('✅ Django is ready!');
          console.log('🚀 Starting Express server...');
          
          // Start Express
          const express = spawn('npm', ['run', 'start'], {
            stdio: 'inherit',
            shell: true,
          });

          express.on('error', (err) => {
            console.error('❌ Express failed to start:', err);
            process.exit(1);
          });

          express.on('close', (code) => {
            console.log('Express exited with code', code);
            django.kill();
            process.exit(code);
          });
        } else {
          checkAgain();
        }
      });

      req.on('error', () => {
        checkAgain();
      });
    };

    const checkAgain = () => {
      attempts++;
      if (attempts < 10) {
        setTimeout(checkDjango, 1000);
      } else {
        console.log('⚠️  Django startup verification timed out, starting Express anyway...');
        console.log('🚀 Starting Express server...');
        
        const express = spawn('npm', ['run', 'start'], {
          stdio: 'inherit',
          shell: true,
        });

        express.on('error', (err) => {
          console.error('❌ Express failed to start:', err);
          process.exit(1);
        });

        express.on('close', (code) => {
          console.log('Express exited with code', code);
          django.kill();
          process.exit(code);
        });
      }
    };

    checkDjango();
  }, 3000);

  // Cleanup on exit
  process.on('exit', () => {
    django.kill();
  });
});

migrate.on('error', (err) => {
  console.error('❌ Migration process failed:', err);
  process.exit(1);
});

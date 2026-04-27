#!/bin/bash
set -e

echo "🚀 Starting Dental Care System on Railway..."

# Install Python dependencies if pip is available
if command -v pip3 &> /dev/null; then
  echo "📦 Installing Python dependencies..."
  pip3 install -r requirements.txt
  
  echo "🗄️  Running Django migrations..."
  cd backend
  python3 manage.py migrate --run-syncdb
  cd ..
  
  echo "⏳ Starting Django in background..."
  cd backend
  python3 -m gunicorn dental_care.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 60 &
  DJANGO_PID=$!
  cd ..
  
  sleep 2
else
  echo "⚠️  Python not found, skipping Django setup"
fi

echo "🚀 Starting Express server..."
NODE_ENV=production npm run start:express

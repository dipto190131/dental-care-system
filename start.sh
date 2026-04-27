#!/bin/bash
set -e

echo "🗄️  Running Django migrations..."
python backend/manage.py migrate --run-syncdb

echo "⏳ Starting Django backend..."
cd backend
python -m gunicorn dental_care.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120 --access-logfile - --error-logfile - 2>&1 &
DJANGO_PID=$!
cd ..

echo "⏸️  Waiting for Django to start..."
sleep 5

echo "🚀 Starting Express server..."
npm run start

# Cleanup on exit
trap "kill $DJANGO_PID 2>/dev/null || true" EXIT


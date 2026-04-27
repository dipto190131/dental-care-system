#!/bin/bash
set -e

echo "🗄️  Running Django migrations..."
python backend/manage.py migrate --run-syncdb

echo "⏳ Starting Django backend..."
cd backend
python -m gunicorn dental_care.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120 --daemon
cd ..

echo "🚀 Starting Express server..."
npm run start


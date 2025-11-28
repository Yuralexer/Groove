#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Applying database migrations..."
uv run python manage.py migrate

echo "Collecting static files..."
uv run python manage.py collectstatic --no-input --clear

echo "Starting server..."
exec uv run uvicorn Groove.asgi:application --host 0.0.0.0 --port 8000 --reload
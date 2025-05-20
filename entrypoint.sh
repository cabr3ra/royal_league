#!/bin/bash

echo "🔧 Ejecutando migraciones..."
python manage.py migrate --noinput

echo "📦 Generando datos diarios..."
python manage.py shell -c "from royal_app.tasks import generate_daily_player, generate_daily_career, generate_daily_attempts; generate_daily_player.apply(); generate_daily_career.apply(); generate_daily_attempts.apply()"

echo "🚀 Iniciando servidor Django..."
gunicorn royal_league.wsgi:application --bind 0.0.0.0:$PORT

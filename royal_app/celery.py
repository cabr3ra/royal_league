from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Set the Django settings environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'royal_league.settings')

# Create the Celery application
app = Celery('royal_league')

# Load settings from Django's settings.py, with the prefix CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically find tasks in all installed Django apps
app.autodiscover_tasks()
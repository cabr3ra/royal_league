import os
from celery import Celery

# Make sure Django uses the right settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'royal_league.settings')

# Create the Celery app instance
app = Celery('royal_league')

# Settings to avoid using multiple processes
app.conf.worker_concurrency = 1
app.conf.worker_pool = 'solo'

# Configure Celery's message broker and result backend
# These settings are used if not already set in Django's settings
app.conf.update(
    broker_url='redis://localhost:6379/0',    # Where Celery gets messages
    result_backend='redis://localhost:6379/0' # Where Celery saves results
)

# Load Celery settings from Django's settings file
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically find tasks in all Django apps
app.autodiscover_tasks()

# Optional: This is an example task for debugging Celery
@app.task(bind=True)
def debug_task(self):
    print('Debugging task: {0!r}'.format(self.request))
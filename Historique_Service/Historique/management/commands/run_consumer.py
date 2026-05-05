"""
Django management command: run_consumer
Usage: python manage.py run_consumer

Starts the RabbitMQ consumer that listens on 'wams.action_logs' and persists
each message as an ActionLog entry in the database.
"""
from django.core.management.base import BaseCommand
from Historique.consumer import start_consuming


class Command(BaseCommand):
    help = 'Start the RabbitMQ consumer for asynchronous action log processing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(
            'Starting Historique consumer (RabbitMQ)...'
        ))
        start_consuming()

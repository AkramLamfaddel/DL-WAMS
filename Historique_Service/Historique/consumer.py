"""
RabbitMQ Consumer — Historique Service
Reads action log messages from 'wams.action_logs' and persists them to the database.
"""
import os
import json
import time
import logging
import django
import pika

logger = logging.getLogger(__name__)

QUEUE_NAME = 'wams.action_logs'


def _connection_params():
    return pika.ConnectionParameters(
        host=os.environ.get('RABBITMQ_HOST', 'localhost'),
        port=int(os.environ.get('RABBITMQ_PORT', 5672)),
        credentials=pika.PlainCredentials(
            os.environ.get('RABBITMQ_USER', 'guest'),
            os.environ.get('RABBITMQ_PASS', 'guest'),
        ),
        heartbeat=600,
        blocked_connection_timeout=300,
        connection_attempts=5,
        retry_delay=3,
    )


def _process_message(channel, method, properties, body):
    """Callback: parse the message and persist the ActionLog entry."""
    from Historique.models import ActionLog
    try:
        data = json.loads(body)
        ActionLog.objects.create(
            user_id=data.get('user_id'),
            action=data.get('action', 'other'),
            details=data.get('details', {}),
            service=data.get('service', 'unknown'),
        )
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f"[Consumer] Logged '{data.get('action')}' for user {data.get('user_id')}")
    except Exception as exc:
        logger.error(f"[Consumer] Failed to process message: {exc} — body: {body}")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consuming():
    """
    Blocking consumer loop with automatic reconnection.
    Runs forever — intended to be started via `python manage.py run_consumer`.
    """
    logger.info("[Consumer] Starting RabbitMQ consumer for queue: %s", QUEUE_NAME)
    while True:
        try:
            connection = pika.BlockingConnection(_connection_params())
            channel    = connection.channel()
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=_process_message)
            logger.info("[Consumer] Ready. Waiting for messages...")
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError as exc:
            logger.error(f"[Consumer] Connection error: {exc}. Retrying in 5s...")
            time.sleep(5)
        except Exception as exc:
            logger.error(f"[Consumer] Unexpected error: {exc}. Retrying in 5s...")
            time.sleep(5)

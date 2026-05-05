"""
RabbitMQ Publisher — GalleryImage Service
Publishes action log events to the 'wams.action_logs' queue asynchronously.
"""
import os
import json
import logging
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
        connection_attempts=3,
        retry_delay=2,
        heartbeat=60,
        blocked_connection_timeout=30,
    )


def publish_action_log(user_id, action, details=None, service='GalleryImage_Service'):
    """
    Publish an action log message to RabbitMQ.
    Returns True on success, False on failure (caller should use HTTP fallback).
    """
    message = {
        'user_id': user_id,
        'action':  action,
        'details': details or {},
        'service': service,
    }
    try:
        connection = pika.BlockingConnection(_connection_params())
        channel    = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=pika.DeliveryMode.Persistent,
            ),
        )
        connection.close()
        logger.info(f"[RabbitMQ] Published '{action}' for user {user_id}")
        return True
    except Exception as exc:
        logger.warning(f"[RabbitMQ] Publish failed: {exc}")
        return False

"""
Consul Service Registration & Discovery — Historique Service
"""
import os
import socket
import logging
import consul

logger = logging.getLogger(__name__)


def _get_client():
    return consul.Consul(
        host=os.environ.get('CONSUL_HOST', 'localhost'),
        port=int(os.environ.get('CONSUL_PORT', 8500)),
    )


def register_service():
    service_name = os.environ.get('SERVICE_NAME', 'historique-service')
    service_host = os.environ.get('SERVICE_HOST', socket.gethostname())
    service_port = int(os.environ.get('SERVICE_PORT', 8003))
    service_id   = f"{service_name}-{service_host}"

    try:
        c = _get_client()
        c.agent.service.register(
            name=service_name,
            service_id=service_id,
            address=service_host,
            port=service_port,
            check=consul.Check.http(
                f"http://{service_host}:{service_port}/api/history/health/",
                interval="10s",
                timeout="5s",
                deregister="30s",
            ),
        )
        logger.info(f"[Consul] Registered '{service_name}' → {service_host}:{service_port}")
    except Exception as exc:
        logger.warning(f"[Consul] Registration failed: {exc}")

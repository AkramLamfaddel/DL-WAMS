"""
Consul Service Registration & Discovery
Registers this microservice with Consul on startup and resolves other services dynamically.
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
    """Register this microservice with Consul. Called from AppConfig.ready()."""
    service_name = os.environ.get('SERVICE_NAME', 'unknown-service')
    service_host = os.environ.get('SERVICE_HOST', socket.gethostname())
    service_port = int(os.environ.get('SERVICE_PORT', 8000))
    service_id   = f"{service_name}-{service_host}"

    try:
        c = _get_client()
        c.agent.service.register(
            name=service_name,
            service_id=service_id,
            address=service_host,
            port=service_port,
            check=consul.Check.http(
                f"http://{service_host}:{service_port}/api/auth/health/",
                interval="10s",
                timeout="5s",
                deregister="30s",
            ),
        )
        logger.info(f"[Consul] Registered '{service_name}' → {service_host}:{service_port}")
    except Exception as exc:
        logger.warning(f"[Consul] Registration failed for '{service_name}': {exc}")


def resolve_service(service_name, fallback_env_var=None):
    """
    Resolve a service base URL via Consul.
    Falls back to an environment variable if Consul is unavailable.
    """
    try:
        c = _get_client()
        _, services = c.health.service(service_name, passing=True)
        if services:
            svc = services[0]['Service']
            url = f"http://{svc['Address']}:{svc['Port']}"
            logger.debug(f"[Consul] Resolved '{service_name}' → {url}")
            return url
    except Exception as exc:
        logger.warning(f"[Consul] Resolution failed for '{service_name}': {exc}")

    # Fallback to environment variable
    if fallback_env_var:
        return os.environ.get(fallback_env_var)
    return None

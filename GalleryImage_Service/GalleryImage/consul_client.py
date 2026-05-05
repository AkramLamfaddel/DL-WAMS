"""
Consul Service Registration & Discovery
"""
import os
import socket
import logging
import time
import consul

logger = logging.getLogger(__name__)

# Cache resolved URLs briefly to avoid repeated Consul calls (especially during restarts)
_RESOLVE_CACHE = {}  # { service_name: (expires_at_monotonic, url_or_none) }
_CACHE_TTL_S = float(os.environ.get("CONSUL_RESOLVE_CACHE_TTL", "10"))


def _get_client():
    # Apply a short socket timeout so Consul calls never stall API requests.
    # We use socket.setdefaulttimeout instead of the consul kwarg because
    # some versions of python-consul don't support the 'timeout' parameter.
    timeout = float(os.environ.get("CONSUL_TIMEOUT", "0.5"))
    old_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(timeout)
    try:
        return consul.Consul(
            host=os.environ.get('CONSUL_HOST', 'localhost'),
            port=int(os.environ.get('CONSUL_PORT', 8500)),
        )
    finally:
        socket.setdefaulttimeout(old_timeout)


def register_service():
    service_name = os.environ.get('SERVICE_NAME', 'unknown-service')
    service_host = os.environ.get('SERVICE_HOST', socket.gethostname())
    service_port = int(os.environ.get('SERVICE_PORT', 8001))
    service_id   = f"{service_name}-{service_host}"

    try:
        c = _get_client()
        c.agent.service.register(
            name=service_name,
            service_id=service_id,
            address=service_host,
            port=service_port,
            check=consul.Check.http(
                f"http://{service_host}:{service_port}/gallery/api/health/",
                interval="10s",
                timeout="5s",
                deregister="30s",
            ),
        )
        logger.info(f"[Consul] Registered '{service_name}' → {service_host}:{service_port}")
    except Exception as exc:
        logger.warning(f"[Consul] Registration failed for '{service_name}': {exc}")


def resolve_service(service_name, fallback_env_var=None):
    now = time.monotonic()
    cached = _RESOLVE_CACHE.get(service_name)
    if cached and cached[0] > now:
        return cached[1] or (os.environ.get(fallback_env_var) if fallback_env_var else None)

    try:
        c = _get_client()
        _, services = c.health.service(service_name, passing=True)
        if services:
            svc = services[0]['Service']
            url = f"http://{svc['Address']}:{svc['Port']}"
            _RESOLVE_CACHE[service_name] = (now + _CACHE_TTL_S, url)
            return url
    except Exception as exc:
        logger.warning(f"[Consul] Resolution failed for '{service_name}': {exc}")

    if fallback_env_var:
        url = os.environ.get(fallback_env_var)
        _RESOLVE_CACHE[service_name] = (now + _CACHE_TTL_S, url)
        return url

    _RESOLVE_CACHE[service_name] = (now + _CACHE_TTL_S, None)
    return None

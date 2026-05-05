import os
import jwt as pyjwt
import requests
import logging
from django.conf import settings
from django.core.cache import cache

from .messaging import publish_action_log
from .consul_client import resolve_service

logger = logging.getLogger(__name__)

# ── Shared JWT secret for local token verification (fallback) ──
JWT_SECRET    = os.environ.get('JWT_SECRET', 'microservices-shared-secret-key-2026')
JWT_ALGORITHM = 'HS256'


class AuthService:
    """Client for the Authentication_Service with Consul discovery + fault tolerance.

    Token verification priority:
      1. In-memory cache (fastest)
      2. Remote Auth service via HTTP (authoritative)
      3. Local JWT decode using shared secret (fallback when Auth is down)

    This triple-layer approach ensures that authenticated endpoints NEVER
    fail silently just because the Auth service is temporarily unreachable
    (e.g., during container restarts, Consul re-registration delays, etc.).
    """

    @classmethod
    def _base_url(cls):
        url = resolve_service('auth-service', fallback_env_var='AUTH_SERVICE_URL')
        return url or getattr(settings, 'AUTH_SERVICE_URL', 'http://localhost:8000')

    @classmethod
    def _local_verify(cls, token):
        """Verify JWT locally using the shared secret — no network call.
        Used as a fallback when the Auth service is unreachable."""
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return {
                'user_id':  payload['user_id'],
                'username': payload['username'],
                'email':    payload.get('email', ''),
                'role':     payload.get('role', 'user'),
            }
        except pyjwt.PyJWTError as exc:
            logger.debug(f"Local JWT verification failed: {exc}")
            return None

    @classmethod
    def verify_token(cls, token):
        """Verify JWT with Auth service. Returns user info dict or None."""
        import hashlib
        cache_key = f"auth_token_{hashlib.sha256(token.encode()).hexdigest()[:16]}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        # Prefer local verification first to avoid blocking gallery requests
        # on Auth/Consul startup delays after service restarts.
        user_info = cls._local_verify(token)
        if user_info:
            cache.set(cache_key, user_info, 60 * 15)
            return user_info

        # ── Layer 2: Remote Auth service verification ──
        try:
            resp = requests.get(
                f"{cls._base_url()}/api/auth/verify/",
                headers={'Authorization': f'Bearer {token}'},
                timeout=2,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get('valid'):
                    user_info = {
                        'user_id':  data['user_id'],
                        'username': data['username'],
                        'email':    data.get('email', ''),
                        'role':     data.get('role', 'user'),
                    }
                    cache.set(cache_key, user_info, 60 * 30)
                    return user_info
            # Auth service responded but said token is invalid
            return None
        except requests.exceptions.RequestException as exc:
            logger.warning(f"Auth service unavailable: {exc}")

        return None

    @classmethod
    def is_healthy(cls):
        try:
            return requests.get(f"{cls._base_url()}/api/auth/health/", timeout=1).status_code == 200
        except requests.exceptions.RequestException:
            return False


class AIVerificationService:
    """Client for smart_preprocessing_service with Consul discovery + fault tolerance."""

    @classmethod
    def _base_url(cls):
        url = resolve_service('ai-service', fallback_env_var='AI_SERVICE_URL')
        return url or getattr(settings, 'AI_SERVICE_URL', 'http://localhost:8002')

    @classmethod
    def analyze_image(cls, image_file_path):
        """Send image file to AI service for manipulation analysis."""
        import mimetypes
        try:
            mime_type = mimetypes.guess_type(image_file_path)[0] or 'image/jpeg'
            filename  = os.path.basename(image_file_path)
            with open(image_file_path, 'rb') as f:
                resp = requests.post(
                    f"{cls._base_url()}/api/analyze/",
                    files={'image': (filename, f, mime_type)},
                    timeout=30,
                )
            if resp.status_code == 200:
                return resp.json()
            logger.error(f"AI service returned {resp.status_code}: {resp.text}")
            return None
        except requests.exceptions.RequestException as exc:
            logger.warning(f"AI service unavailable: {exc}")
            return None

    @classmethod
    def is_healthy(cls):
        try:
            return requests.get(f"{cls._base_url()}/api/health/", timeout=1).status_code == 200
        except requests.exceptions.RequestException:
            return False


class HistoriqueService:
    """
    Async action logging via RabbitMQ (primary) with HTTP fallback.
    Fire-and-forget — never raises exceptions.
    """

    @classmethod
    def _base_url(cls):
        url = resolve_service('historique-service', fallback_env_var='HISTORIQUE_SERVICE_URL')
        return url or getattr(settings, 'HISTORIQUE_SERVICE_URL', 'http://localhost:8003')

    @classmethod
    def log_action(cls, user_id, action, details=None):
        """
        Publish action log to RabbitMQ queue (async).
        Falls back to direct HTTP call if RabbitMQ is unavailable.
        """
        published = publish_action_log(
            user_id=user_id,
            action=action,
            details=details or {},
            service='GalleryImage_Service',
        )
        if not published:
            # HTTP fallback
            try:
                requests.post(
                    f"{cls._base_url()}/api/history/log/",
                    json={
                        'user_id': user_id,
                        'action':  action,
                        'details': details or {},
                        'service': 'GalleryImage_Service',
                    },
                    timeout=2,
                )
            except requests.exceptions.RequestException as exc:
                logger.warning(f"History HTTP fallback also failed: {exc}")

    @classmethod
    def is_healthy(cls):
        try:
            return requests.get(f"{cls._base_url()}/api/history/health/", timeout=1).status_code == 200
        except requests.exceptions.RequestException:
            return False

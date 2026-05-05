from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Auth'

    def ready(self):
        """Register with Consul when Django starts."""
        import os
        # Skip during migrations / management commands that don't need Consul
        if os.environ.get('CONSUL_HOST'):
            try:
                from .consul_client import register_service
                register_service()
            except Exception:
                pass  # Never crash startup due to Consul

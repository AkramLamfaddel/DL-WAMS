from django.apps import AppConfig


class GalleryimageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'GalleryImage'

    def ready(self):
        """Register with Consul when Django starts."""
        import os
        if os.environ.get('CONSUL_HOST'):
            try:
                from .consul_client import register_service
                register_service()
            except Exception:
                pass

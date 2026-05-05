from django.urls import path
from . import api_views

app_name = 'gallery'

urlpatterns = [
    # ─── Images ────────────────────────────────────────────────
    path('api/images/', api_views.image_list_api, name='api_image_list'),
    path('api/images/<int:image_id>/', api_views.image_detail_api, name='api_image_detail'),
    path('api/images/<int:image_id>/verify/', api_views.image_verify_api, name='api_image_verify'),
    path('api/images/<int:image_id>/tags/', api_views.image_tags_api, name='api_image_tags'),
    path('api/images/<int:image_id>/favorite/', api_views.toggle_favorite_api, name='api_toggle_favorite'),

    # ─── Albums ────────────────────────────────────────────────
    path('api/albums/', api_views.album_list_api, name='api_album_list'),
    path('api/albums/<int:album_id>/', api_views.album_detail_api, name='api_album_detail'),
    path('api/albums/<int:album_id>/images/', api_views.album_images_api, name='api_album_images'),

    # ─── Tags ──────────────────────────────────────────────────
    path('api/tags/', api_views.tag_list_api, name='api_tag_list'),
    path('api/tags/<int:tag_id>/', api_views.tag_detail_api, name='api_tag_detail'),

    # ─── Favorites ─────────────────────────────────────────────
    path('api/favorites/', api_views.favorites_list_api, name='api_favorites'),

    # ─── Stats & Health ────────────────────────────────────────
    path('api/stats/', api_views.stats_api, name='api_stats'),
    path('api/health/', api_views.health_api, name='api_health'),
    path('api/warmup/', api_views.warmup_api, name='api_warmup'),
]

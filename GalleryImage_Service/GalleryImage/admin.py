from django.contrib import admin
from .models import Image, Album, ImageVerification


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'user_username', 'verification_status', 'ai_confidence_score', 'uploaded_at']
    list_filter = ['verification_status', 'uploaded_at']
    search_fields = ['title', 'user_username']
    readonly_fields = ['uploaded_at', 'updated_at', 'verified_at']


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ['title', 'user_username', 'created_at']
    search_fields = ['title']


@admin.register(ImageVerification)
class ImageVerificationAdmin(admin.ModelAdmin):
    list_display = ['image', 'status', 'confidence_score', 'requested_at', 'completed_at']
    list_filter = ['status']

import os
import functools
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone

from .models import Image, Album, Tag, ImageVerification
from .serializers import (
    ImageSerializer, ImageUploadSerializer, VerificationSerializer,
    AlbumSerializer, TagSerializer,
)
from .services import AuthService, AIVerificationService, HistoriqueService
from .utils import validate_image_file, generate_thumbnail, get_image_dimensions

logger = logging.getLogger(__name__)


def get_user_from_request(request):
    """Extract user info from JWT in Authorization header."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth.split(' ')[1]
    return AuthService.verify_token(token)


def require_auth(view_func):
    """Decorator for API views that require authentication."""
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = get_user_from_request(request)
        if not user:
            return Response({'error': 'Authentication required.'}, status=401)
        request.user_info = user
        return view_func(request, *args, **kwargs)
    return wrapper


# ─── Images API ───────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@require_auth
def image_list_api(request):
    """GET: list user images (filterable by ?status=edited). POST: upload."""
    uid = request.user_info['user_id']

    if request.method == 'GET':
        images = Image.objects.filter(user_id=uid).select_related('album').prefetch_related('tags')
        status_filter = request.query_params.get('status')
        if status_filter:
            images = images.filter(verification_status=status_filter)
        serializer = ImageSerializer(images, many=True, context={'request': request})
        return Response(serializer.data)

    # POST — upload
    ser = ImageUploadSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    image_file = ser.validated_data['image_file']
    title = ser.validated_data.get('title', '').strip() or os.path.splitext(image_file.name)[0]
    description = ser.validated_data.get('description', '')

    errors = validate_image_file(image_file)
    if errors:
        return Response({'errors': errors}, status=400)

    width, height = get_image_dimensions(image_file)
    image_file.seek(0)
    thumbnail = generate_thumbnail(image_file)
    image_file.seek(0)

    image = Image(
        title=title, description=description, image_file=image_file,
        user_id=uid, user_username=request.user_info['username'],
        original_filename=image_file.name, file_size=image_file.size,
        mime_type=image_file.content_type or 'image/jpeg',
        width=width, height=height,
        verification_status=Image.VerificationStatus.PENDING,
    )
    if thumbnail:
        image.thumbnail = thumbnail

    # Assign to album if provided
    album_id = ser.validated_data.get('album_id')
    if album_id:
        try:
            album = Album.objects.get(id=album_id, user_id=uid)
            image.album = album
        except Album.DoesNotExist:
            pass

    image.save()

    HistoriqueService.log_action(uid, 'image_uploaded', {'image_id': image.id, 'title': title})

    # AI verification is now user-initiated (optional) — image stays pending
    # Users can verify from the frontend via POST /gallery/api/images/{id}/verify/

    return Response(ImageSerializer(image, context={'request': request}).data, status=201)


@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
@require_auth
def image_detail_api(request, image_id):
    """GET: image detail with verifications. DELETE: remove image."""
    try:
        image = Image.objects.select_related('album').prefetch_related('tags', 'verifications').get(
            id=image_id,
            user_id=request.user_info['user_id'],
        )
    except Image.DoesNotExist:
        return Response({'error': 'Image not found.'}, status=404)

    if request.method == 'DELETE':
        if image.image_file:
            image.image_file.delete(save=False)
        if image.thumbnail:
            image.thumbnail.delete(save=False)
        image.delete()
        HistoriqueService.log_action(request.user_info['user_id'], 'image_deleted', {'title': image.title})
        return Response({'message': 'Image deleted.'}, status=204)

    data = ImageSerializer(image, context={'request': request}).data
    data['verifications'] = VerificationSerializer(image.verifications.all(), many=True).data
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
@require_auth
def image_verify_api(request, image_id):
    """Trigger AI verification for an image."""
    try:
        image = Image.objects.get(id=image_id, user_id=request.user_info['user_id'])
    except Image.DoesNotExist:
        return Response({'error': 'Image not found.'}, status=404)

    ai_result = AIVerificationService.analyze_image(image.image_file.path)
    if not ai_result:
        return Response({'error': 'AI service unavailable.'}, status=503)

    is_modified = ai_result.get('is_modified', False)
    confidence = ai_result.get('confidence', 0.0)
    image.verification_status = (
        Image.VerificationStatus.EDITED if is_modified
        else Image.VerificationStatus.UNEDITED
    )
    image.ai_confidence_score = confidence
    image.ai_report = ai_result
    image.verified_at = timezone.now()
    image.save()
    ImageVerification.objects.create(
        image=image, status=image.verification_status,
        confidence_score=confidence, ai_response=ai_result,
        completed_at=timezone.now(),
    )

    # Log verification to Historique service
    HistoriqueService.log_action(
        request.user_info['user_id'], 'image_verified',
        {'image_id': image.id, 'title': image.title,
         'status': image.verification_status, 'confidence': confidence}
    )

    return Response(ImageSerializer(image, context={'request': request}).data)


# ─── Stats & Health ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
@require_auth
def stats_api(request):
    """Dashboard statistics."""
    uid = request.user_info['user_id']
    images = Image.objects.filter(user_id=uid)
    return Response({
        'total': images.count(),
        'pending': images.filter(verification_status='pending').count(),
        'unedited': images.filter(verification_status='unedited').count(),
        'edited': images.filter(verification_status='edited').count(),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_api(request):
    """Service health check — reports only this service's status."""
    return Response({
        'status': 'healthy',
        'service': 'GalleryImage_Service',
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def warmup_api(request):
    """
    Auth-cache warm-up endpoint.

    Fires the same auth verification path that image upload triggers.
    This ensures that after a Gallery service restart, the very first
    GET /images/ request finds the token already cached — no 401, no retry.

    Returns 200 always (never 401) so the frontend can call this as
    fire-and-forget without triggering error loops.
    """
    user = get_user_from_request(request)
    if not user:
        return Response({'warmed': False, 'reason': 'no_token'}, status=200)

    uid = user['user_id']
    count = Image.objects.filter(user_id=uid).count()

    logger.info(
        "Warmup completed for user_id=%s — %s images found",
        uid, count,
    )
    return Response({
        'warmed': True,
        'user_id': uid,
        'image_count': count,
    })


# ─── Albums API ───────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@require_auth
def album_list_api(request):
    """GET: list user albums. POST: create a new album."""
    uid = request.user_info['user_id']

    if request.method == 'GET':
        albums = Album.objects.filter(user_id=uid)
        return Response(AlbumSerializer(albums, many=True, context={'request': request}).data)

    # POST — create album
    title = request.data.get('title', '').strip()
    if not title:
        return Response({'error': 'Album title is required.'}, status=400)

    album = Album.objects.create(
        title=title,
        description=request.data.get('description', ''),
        user_id=uid,
        user_username=request.user_info['username'],
    )
    return Response(AlbumSerializer(album, context={'request': request}).data, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
@require_auth
def album_detail_api(request, album_id):
    """GET: album detail with images. PUT: update album. DELETE: delete album."""
    uid = request.user_info['user_id']
    try:
        album = Album.objects.get(id=album_id, user_id=uid)
    except Album.DoesNotExist:
        return Response({'error': 'Album not found.'}, status=404)

    if request.method == 'GET':
        data = AlbumSerializer(album, context={'request': request}).data
        images = Image.objects.filter(album=album, user_id=uid)
        data['images'] = ImageSerializer(images, many=True, context={'request': request}).data
        return Response(data)

    if request.method == 'PUT':
        if 'title' in request.data:
            album.title = request.data['title'].strip()
        if 'description' in request.data:
            album.description = request.data['description']
        if 'cover_image_id' in request.data:
            cover_id = request.data['cover_image_id']
            if cover_id:
                try:
                    album.cover_image = Image.objects.get(id=cover_id, user_id=uid)
                except Image.DoesNotExist:
                    pass
            else:
                album.cover_image = None
        album.save()
        return Response(AlbumSerializer(album, context={'request': request}).data)

    # DELETE
    album.delete()
    return Response({'status': 'deleted'}, status=204)


@api_view(['POST', 'DELETE'])
@permission_classes([AllowAny])
@require_auth
def album_images_api(request, album_id):
    """POST: add images to album. DELETE: remove images from album."""
    uid = request.user_info['user_id']
    try:
        album = Album.objects.get(id=album_id, user_id=uid)
    except Album.DoesNotExist:
        return Response({'error': 'Album not found.'}, status=404)

    image_ids = request.data.get('image_ids', [])
    if not image_ids:
        return Response({'error': 'image_ids is required.'}, status=400)

    images = Image.objects.filter(id__in=image_ids, user_id=uid)

    if request.method == 'POST':
        images.update(album=album)
        return Response({'status': 'added', 'count': images.count()})

    # DELETE — remove from album (set album to null)
    images.update(album=None)
    return Response({'status': 'removed', 'count': images.count()})


# ─── Tags API ─────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@require_auth
def tag_list_api(request):
    """GET: list user tags. POST: create a new tag."""
    uid = request.user_info['user_id']

    if request.method == 'GET':
        tags = Tag.objects.filter(user_id=uid)
        return Response(TagSerializer(tags, many=True).data)

    # POST — create tag
    name = request.data.get('name', '').strip().lower()
    if not name:
        return Response({'error': 'Tag name is required.'}, status=400)

    color = request.data.get('color', '#adc6ff')
    tag, created = Tag.objects.get_or_create(
        name=name, user_id=uid,
        defaults={'color': color},
    )
    return Response(TagSerializer(tag).data, status=201 if created else 200)


@api_view(['DELETE'])
@permission_classes([AllowAny])
@require_auth
def tag_detail_api(request, tag_id):
    """DELETE a tag."""
    try:
        tag = Tag.objects.get(id=tag_id, user_id=request.user_info['user_id'])
    except Tag.DoesNotExist:
        return Response({'error': 'Tag not found.'}, status=404)
    tag.delete()
    return Response({'status': 'deleted'}, status=204)


@api_view(['POST', 'DELETE'])
@permission_classes([AllowAny])
@require_auth
def image_tags_api(request, image_id):
    """POST: add tags to image. DELETE: remove tags from image."""
    uid = request.user_info['user_id']
    try:
        image = Image.objects.get(id=image_id, user_id=uid)
    except Image.DoesNotExist:
        return Response({'error': 'Image not found.'}, status=404)

    tag_ids = request.data.get('tag_ids', [])
    tags = Tag.objects.filter(id__in=tag_ids, user_id=uid)

    if request.method == 'POST':
        image.tags.add(*tags)
    else:
        image.tags.remove(*tags)

    return Response(ImageSerializer(image, context={'request': request}).data)


# ─── Favorites API ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
@require_auth
def toggle_favorite_api(request, image_id):
    """Toggle favorite status for an image."""
    uid = request.user_info['user_id']
    try:
        image = Image.objects.get(id=image_id, user_id=uid)
    except Image.DoesNotExist:
        return Response({'error': 'Image not found.'}, status=404)

    image.is_favorite = not image.is_favorite
    image.save(update_fields=['is_favorite', 'updated_at'])
    return Response({'id': image.id, 'is_favorite': image.is_favorite})


@api_view(['GET'])
@permission_classes([AllowAny])
@require_auth
def favorites_list_api(request):
    """GET: list all favorite images for current user."""
    uid = request.user_info['user_id']
    images = Image.objects.filter(user_id=uid, is_favorite=True).select_related('album').prefetch_related('tags')
    return Response(ImageSerializer(images, many=True, context={'request': request}).data)

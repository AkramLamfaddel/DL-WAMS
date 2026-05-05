"""
AI Analysis API Endpoints
POST /api/analyze/  — Analyze an image for manipulation
GET  /api/health/   — Service health check
GET  /api/status/   — Model status and configuration
"""
import time
import logging
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .preprocessing import preprocess_image, get_image_info
from .model_loader import predict, get_model_status

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser])
def analyze_image(request):
    """
    Analyze an image for tampering/manipulation.

    Expects: multipart/form-data with 'image' file field.
    Returns: {is_modified, confidence, class_name, probabilities, ...}
    """
    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'error': 'No image file provided. Send as "image" field.'}, status=400)

    # Validate file type — check content_type, fallback to filename extension
    import mimetypes
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
    content_type = image_file.content_type
    if not content_type or content_type == 'application/octet-stream':
        content_type = mimetypes.guess_type(image_file.name)[0] or ''
    if content_type not in allowed_types:
        return Response({'error': f'Unsupported image type: {content_type}'}, status=400)

    try:
        start_time = time.time()

        # Get original image info
        image_info = get_image_info(image_file)
        image_file.seek(0)

        # Preprocess (resize, normalize, convert to tensor format)
        preprocessed = preprocess_image(image_file)

        # Run prediction
        result = predict(preprocessed)

        processing_time = round(time.time() - start_time, 3)

        response = {
            'is_modified': result['is_modified'],
            'confidence': result['confidence'],
            'class_name': result['class_name'],
            'probabilities': result['probabilities'],
            'model': result['model'],
            'mock': result['mock'],
            'image_info': image_info,
            'processing_time_seconds': processing_time,
        }

        logger.info(
            f"Analysis complete: {'FAKE' if result['is_modified'] else 'REAL'} "
            f"({result['confidence']}%) in {processing_time}s "
            f"[{'MOCK' if result['mock'] else 'MODEL'}]"
        )

        return Response(response)

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return Response({'error': f'Analysis failed: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Service health check."""
    return Response({
        'status': 'healthy',
        'service': 'smart_preprocessing_service',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def model_status(request):
    """Return current model configuration and status."""
    return Response(get_model_status())

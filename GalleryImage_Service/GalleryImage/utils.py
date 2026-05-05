import os
from io import BytesIO
from PIL import Image as PILImage
from django.core.files.base import ContentFile

ALLOWED_IMAGE_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def validate_image_file(file):
    """Validate an uploaded image file. Returns list of error strings."""
    errors = []
    if file.size > MAX_FILE_SIZE:
        errors.append(f"File size ({file.size / 1024 / 1024:.1f} MB) exceeds maximum of 50 MB.")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        errors.append(f"File type '{file.content_type}' is not supported.")
    return errors


def generate_thumbnail(image_file, max_size=(400, 400)):
    """Generate a JPEG thumbnail. Returns ContentFile or None."""
    try:
        img = PILImage.open(image_file)
        img.thumbnail(max_size, PILImage.LANCZOS)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        buf = BytesIO()
        img.save(buf, format='JPEG', quality=85)
        buf.seek(0)
        name = f"thumb_{os.path.splitext(os.path.basename(image_file.name))[0]}.jpg"
        return ContentFile(buf.read(), name=name)
    except Exception:
        return None


def get_image_dimensions(image_file):
    """Returns (width, height) tuple or (None, None)."""
    try:
        img = PILImage.open(image_file)
        return img.width, img.height
    except Exception:
        return None, None

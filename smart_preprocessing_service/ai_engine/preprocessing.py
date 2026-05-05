"""
Image Preprocessing Pipeline
Prepares images for the AI model — resize, normalize, convert to tensor.
All operations match standard ImageNet preprocessing used during training.
"""
from PIL import Image
import numpy as np
import io
from . import config


def preprocess_image(image_input):
    """
    Preprocess an image for model prediction.

    Args:
        image_input: file path (str), file-like object, or bytes

    Returns:
        numpy array of shape (1, 3, INPUT_SIZE, INPUT_SIZE) — ready for model
    """
    # Step 1: Open image
    if isinstance(image_input, str):
        img = Image.open(image_input)
    elif isinstance(image_input, bytes):
        img = Image.open(io.BytesIO(image_input))
    else:
        img = Image.open(image_input)

    # Step 2: Convert to RGB (remove alpha channel, handle grayscale)
    img = img.convert('RGB')

    # Step 3: Resize to model's expected input size
    img = img.resize((config.INPUT_SIZE, config.INPUT_SIZE), Image.LANCZOS)

    # Step 4: Convert to numpy array and normalize to [0, 1]
    arr = np.array(img, dtype=np.float32) / 255.0

    # Step 5: Apply ImageNet normalization (channel-wise)
    mean = np.array(config.NORMALIZE_MEAN, dtype=np.float32)
    std = np.array(config.NORMALIZE_STD, dtype=np.float32)
    arr = (arr - mean) / std

    # Step 6: Convert from HWC (height, width, channels) to CHW (channels, height, width)
    # PyTorch models expect CHW format
    arr = arr.transpose(2, 0, 1)

    # Step 7: Add batch dimension → (1, 3, 224, 224)
    arr = np.expand_dims(arr, axis=0)

    return arr


def get_image_info(image_input):
    """Get basic image information before preprocessing."""
    if isinstance(image_input, str):
        img = Image.open(image_input)
    elif isinstance(image_input, bytes):
        img = Image.open(io.BytesIO(image_input))
    else:
        pos = image_input.tell()
        img = Image.open(image_input)
        image_input.seek(pos)

    return {
        'original_width': img.width,
        'original_height': img.height,
        'mode': img.mode,
        'format': img.format,
        'preprocessed_size': f'{config.INPUT_SIZE}x{config.INPUT_SIZE}',
    }

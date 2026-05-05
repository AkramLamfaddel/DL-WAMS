# ═══════════════════════════════════════════════════════════════
# AI Model Configuration
# Change these values when you receive the trained model.
# ═══════════════════════════════════════════════════════════════
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Model File ──────────────────────────────────────────────
# Drop your .pth file in the "models/" folder and update this path.
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'vgg16_ela_best.h5')

# ─── Model Architecture ─────────────────────────────────────
# Options: "resnet18", "mobilenet_v2", "efficientnet_b0"
# Must match what your teammate used during training.
MODEL_ARCH = 'vgg16'

# ─── Input Parameters ───────────────────────────────────────
# These MUST match what was used during training.
INPUT_SIZE = 224                    # Image will be resized to INPUT_SIZE x INPUT_SIZE
NUM_CLASSES = 2                     # 0 = Real (authentic), 1 = Fake (manipulated)
CLASS_NAMES = ['real', 'fake']      # Labels for each class index

# ─── ImageNet Normalization ──────────────────────────────────
# Standard values used by ALL pretrained models (ResNet, MobileNet, EfficientNet).
# Do NOT change unless your teammate used custom normalization.
NORMALIZE_MEAN = [0.485, 0.456, 0.406]
NORMALIZE_STD = [0.229, 0.224, 0.225]

# ─── Prediction Thresholds ───────────────────────────────────
# Confidence above this threshold = "confident prediction"
CONFIDENCE_THRESHOLD = 0.5

# ─── Mock Mode ───────────────────────────────────────────────
# When True OR when model.pth doesn't exist, returns mock predictions for testing.
# Set to False once you have the real model.
MOCK_MODE = not os.path.exists(MODEL_PATH)

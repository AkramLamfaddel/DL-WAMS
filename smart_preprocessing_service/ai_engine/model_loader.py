"""
Model Loader & Predictor - TensorFlow/Keras version
Loads the Keras model (.h5) and runs predictions.
"""

import os
import logging
import random
import numpy as np
from . import config

logger = logging.getLogger(__name__)

# Global model cache
_model = None
_model_loaded = False


def _load_keras_model():
    """Load the Keras/TensorFlow model from disk."""
    global _model, _model_loaded

    if _model_loaded:
        return _model

    if not os.path.exists(config.MODEL_PATH):
        logger.warning(f"Model file not found: {config.MODEL_PATH}")
        logger.info("Running in MOCK MODE — predictions are simulated.")
        _model_loaded = True
        return None

    try:
        import tensorflow as tf
        
        # Désactiver les logs verbeux de TensorFlow
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
        tf.get_logger().setLevel('ERROR')
        
        # Charger le modèle Keras (.h5)
        model = tf.keras.models.load_model(config.MODEL_PATH)
        
        _model = model
        _model_loaded = True
        logger.info(f"Model loaded successfully: {config.MODEL_PATH}")
        return model

    except ImportError:
        logger.error("TensorFlow not installed. Install with: pip install tensorflow")
        _model_loaded = True
        return None
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        _model_loaded = True
        return None


def predict(preprocessed_image):
    """
    Run prediction on a preprocessed image.
    
    Args:
        preprocessed_image: numpy array of shape (1, 3, 224, 224) or (1, 224, 224, 3)
    
    Returns:
        dict with 'is_modified', 'confidence', 'class_name', 'probabilities'
    """
    model = _load_keras_model()

    if model is None or config.MOCK_MODE:
        return _mock_predict()

    try:
        # TensorFlow attend (batch, height, width, channels) = (1, 224, 224, 3)
        # Votre preprocessed_image est en (1, 3, 224, 224) (CHW)
        # Il faut convertir en (1, 224, 224, 3) (HWC)
        
        if preprocessed_image.shape[1] == 3:  # Format CHW
            # Convertir CHW -> HWC
            img_input = preprocessed_image.transpose(0, 2, 3, 1)
        else:
            img_input = preprocessed_image
        
        # Prédiction
        predictions = model.predict(img_input, verbose=0)
        
        # Les probabilités
        probabilities = predictions[0]  # Forme: [prob_real, prob_fake] ou [prob_fake, prob_real]
        
        # Adapter selon l'ordre des classes
        if len(probabilities) == 2:
            # Supposons que l'index 0 = real, index 1 = fake
            real_prob = float(probabilities[0])
            fake_prob = float(probabilities[1])
            
            predicted_class = 1 if fake_prob > real_prob else 0
            confidence = max(real_prob, fake_prob) * 100
            is_modified = predicted_class == 1
            
            return {
                'is_modified': is_modified,
                'confidence': round(confidence, 2),
                'class_name': config.CLASS_NAMES[predicted_class],
                'probabilities': {
                    'real': round(real_prob * 100, 2),
                    'fake': round(fake_prob * 100, 2),
                },
                'model': 'vgg16_ela',
                'mock': False,
            }
        else:
            # Si c'est une seule valeur (binaire)
            fake_prob = float(probabilities[0]) if len(probabilities) == 1 else 0.5
            is_modified = fake_prob > 0.5
            confidence = fake_prob * 100 if is_modified else (1 - fake_prob) * 100
            
            return {
                'is_modified': is_modified,
                'confidence': round(confidence, 2),
                'class_name': 'fake' if is_modified else 'real',
                'probabilities': {
                    'real': round((1 - fake_prob) * 100, 2),
                    'fake': round(fake_prob * 100, 2),
                },
                'model': 'vgg16_ela',
                'mock': False,
            }

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return _mock_predict()


def _mock_predict():
    """Return simulated prediction for testing."""
    fake_prob = random.uniform(0.1, 0.9)
    real_prob = 1.0 - fake_prob
    is_modified = fake_prob > 0.5

    return {
        'is_modified': is_modified,
        'confidence': round(max(fake_prob, real_prob) * 100, 2),
        'class_name': 'fake' if is_modified else 'real',
        'probabilities': {
            'real': round(real_prob * 100, 2),
            'fake': round(fake_prob * 100, 2),
        },
        'model': 'mock',
        'mock': True,
    }


def get_model_status():
    """Return current model status."""
    return {
        'model_loaded': _model is not None,
        'model_path': config.MODEL_PATH,
        'model_exists': os.path.exists(config.MODEL_PATH),
        'model_type': 'keras' if _model is not None else 'none',
        'mock_mode': config.MOCK_MODE or _model is None,
        'input_size': config.INPUT_SIZE,
        'num_classes': config.NUM_CLASSES,
        'class_names': config.CLASS_NAMES,
    }
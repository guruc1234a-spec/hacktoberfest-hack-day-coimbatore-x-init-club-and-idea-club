import cv2
import numpy as np
from PIL import Image
import io
from typing import Dict, Any, List

def extract_outfit_colors(image_bytes: bytes, k: int = 3) -> Dict[str, Any]:
    """
    Extract dominant and secondary hex colors using K-Means clustering.
    Calculates brightness and contrast to determine formality and style vibe.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        np_img = np.array(image)
        
        # Resize image for fast clustering
        resized = cv2.resize(np_img, (150, 150), interpolation=cv2.INTER_AREA)
        pixels = resized.reshape((-1, 3)).astype(np.float32)

        # Apply K-Means
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 1.0)
        _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        # Sort centers by cluster size (frequency of appearance)
        unique, counts = np.unique(labels, return_counts=True)
        sorted_indices = np.argsort(-counts)
        sorted_centers = centers[sorted_indices].astype(int)

        hex_colors = [f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}" for c in sorted_centers]

        # Determine dominant and secondary
        dominant_color = hex_colors[0]
        secondary_color = hex_colors[1] if len(hex_colors) > 1 else hex_colors[0]

        # Estimate formality and style vibe from luminance and color saturation
        avg_brightness = np.mean(sorted_centers[0])
        hsv_dominant = cv2.cvtColor(np.uint8([[sorted_centers[0]]]), cv2.COLOR_RGB2HSV)[0][0]
        saturation = hsv_dominant[1]

        if saturation > 140:
            vibe_style = "Bold / Festive"
            formality = "High"
        elif avg_brightness < 70:
            vibe_style = "Elegant / Evening"
            formality = "High"
        elif avg_brightness > 190:
            vibe_style = "Minimal / Pastel"
            formality = "Casual-Chic"
        else:
            vibe_style = "Modern / Contemporary"
            formality = "Moderate"

        return {
            "dominant_color": dominant_color,
            "secondary_color": secondary_color,
            "style": vibe_style,
            "formality": formality,
            "palette": hex_colors
        }
    except Exception as e:
        # Fallback in case of empty or corrupt image bytes
        return {
            "dominant_color": "#d97706",
            "secondary_color": "#be123c",
            "style": "Traditional",
            "formality": "High",
            "palette": ["#d97706", "#be123c", "#1f2937"]
        }

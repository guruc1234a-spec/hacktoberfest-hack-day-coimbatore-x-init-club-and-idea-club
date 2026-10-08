"""
Storage service for persisting Saved Looks and Styling History.
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SAVED_LOOKS_FILE = os.path.join(DATA_DIR, "saved_looks.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

def _ensure_data_files():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(SAVED_LOOKS_FILE):
        default_saved = [
            {
                "id": "saved-look-001",
                "title": "Gemma Radiant Velvet Autumn",
                "look": {
                    "id": "look-2-recommended",
                    "name": "Gemma Harmonized Radiant Aura",
                    "intensity": 7,
                    "reasoning": "Dual-tone pairing: mirrors secondary accent #D9A566 with terracotta cheek contouring and berry lips against #801235 velvet.",
                    "makeup": {
                        "eyes": "Sculpted gold bronze cut crease with a crisp winged cat-eye accent.",
                        "cheeks": "Duo-contour using terracotta bronzer topped with luminous liquid rose quartz highlighter.",
                        "lips": "Satin berry velvet lip with defined Cupid's bow contouring."
                    },
                    "products": ["lip-001", "eye-001", "eye-002", "chk-001", "chk-002"],
                    "tutorial_steps": [
                        {
                            "step": 1,
                            "title": "Cheekbone Sculpt & Glow",
                            "instruction": "Sweep blush along cheekbone apex, layering liquid pearl on the top crest.",
                            "face_region": "cheekbone",
                            "technique": "sculpt_and_blend",
                            "estimated_time_sec": 60,
                            "pro_tip": "Keep 2 finger widths away from nose."
                        },
                        {
                            "step": 2,
                            "title": "Bronze Eyeshadow Dimension",
                            "instruction": "Sweep warm gold bronze across eyelid crease and outer corner.",
                            "face_region": "eyelid",
                            "technique": "circular_crease_buff",
                            "estimated_time_sec": 90,
                            "pro_tip": "Blend in small circular motions."
                        },
                        {
                            "step": 3,
                            "title": "Precision Winged Eyeliner",
                            "instruction": "Glide micro-felt tip from inner corner outward, creating a 45-degree wing.",
                            "face_region": "eyeliner",
                            "technique": "flick_and_connect",
                            "estimated_time_sec": 75,
                            "pro_tip": "Keep eyes open looking straight ahead."
                        },
                        {
                            "step": 4,
                            "title": "Velvet Berry Lips",
                            "instruction": "Define Cupid’s bow precisely and glide rich berry pigment across lips.",
                            "face_region": "lips",
                            "technique": "precision_fill",
                            "estimated_time_sec": 45,
                            "pro_tip": "Use bullet tip for razor edges."
                        }
                    ]
                },
                "outfit_attributes": {
                    "dominant_color": "#801235",
                    "secondary_color": "#d9a566",
                    "style": "Traditional",
                    "formality": "Black Tie",
                    "palette": ["#801235", "#d9a566", "#1a1618"]
                },
                "face_profile": {
                    "face_shape": "Oval",
                    "skin_tone": "Medium / Beige",
                    "skin_undertone": "Warm (Golden / Peachy)",
                    "skin_hex": "#e0af87"
                },
                "occasion": "Wedding Reception / Formal Evening",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "notes": "Perfect match for the maroon saree with golden zari embroidery."
            }
        ]
        with open(SAVED_LOOKS_FILE, "w", encoding="utf-8") as f:
            json.dump(default_saved, f, indent=2)

    if not os.path.exists(HISTORY_FILE):
        default_history = [
            {
                "id": "hist-001",
                "type": "look_generation",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "title": "Wedding Reception Atelier Diagnostic",
                "summary": "Generated 3 Gemma 4 looks for #801235 Rose Silk outfit with Oval face morphology.",
                "details": {
                    "dominant_color": "#801235",
                    "secondary_color": "#d9a566",
                    "face_shape": "Oval",
                    "intensity": "Moderate",
                    "looks_count": 3
                }
            },
            {
                "id": "hist-002",
                "type": "face_analysis",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "title": "OpenCV YuNet Facial Scan",
                "summary": "Detected Oval face shape (95% confidence) with Warm Golden Undertone (ITA: 34.5°).",
                "details": {
                    "face_shape": "Oval",
                    "skin_tone": "Medium / Beige",
                    "skin_undertone": "Warm (Golden / Peachy)",
                    "skin_hex": "#e0af87",
                    "symmetry_score": 96.0
                }
            }
        ]
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(default_history, f, indent=2)

def get_saved_looks() -> List[Dict[str, Any]]:
    _ensure_data_files()
    try:
        with open(SAVED_LOOKS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[StorageService] Error loading saved looks: {e}")
        return []

def save_look(look_data: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_data_files()
    looks = get_saved_looks()
    
    if not look_data.get("id"):
        look_data["id"] = f"saved-{uuid.uuid4().hex[:8]}"
    if not look_data.get("created_at"):
        look_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Prepend new saved look
    looks.insert(0, look_data)
    with open(SAVED_LOOKS_FILE, "w", encoding="utf-8") as f:
        json.dump(looks, f, indent=2)
    
    # Also log to history
    log_history_entry({
        "type": "look_saved",
        "title": f"Saved Look: {look_data.get('title', 'Curated Look')}",
        "summary": f"Saved look '{look_data.get('title')}' to personal beauty vault.",
        "details": {
            "saved_look_id": look_data["id"],
            "look_name": look_data.get("look", {}).get("name")
        }
    })
    
    return look_data

def delete_saved_look(look_id: str) -> bool:
    _ensure_data_files()
    looks = get_saved_looks()
    initial_len = len(looks)
    looks = [l for l in looks if l.get("id") != look_id]
    if len(looks) < initial_len:
        with open(SAVED_LOOKS_FILE, "w", encoding="utf-8") as f:
            json.dump(looks, f, indent=2)
        return True
    return False

def get_history() -> List[Dict[str, Any]]:
    _ensure_data_files()
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[StorageService] Error loading history: {e}")
        return []

def log_history_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_data_files()
    history = get_history()
    
    if not entry.get("id"):
        entry["id"] = f"hist-{uuid.uuid4().hex[:8]}"
    if not entry.get("timestamp"):
        entry["timestamp"] = datetime.now(timezone.utc).isoformat()
        
    history.insert(0, entry)
    # Keep last 50 entries
    history = history[:50]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    return entry

def clear_history() -> bool:
    _ensure_data_files()
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, indent=2)
    return True

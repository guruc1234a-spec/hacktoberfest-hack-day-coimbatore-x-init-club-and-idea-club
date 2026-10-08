import pytest
from fastapi.testclient import TestClient
import io
from PIL import Image
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
from schemas.contracts import RecommendRequest, UserProfile, OutfitAttributes

client = TestClient(app)

def create_dummy_image_bytes(color=(220, 50, 100)) -> bytes:
    img = Image.new("RGB", (100, 100), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Gemma 4" in data["ai_model"]
    assert "RTX 5050" in data["gpu_target"]

def test_analyse_outfit_endpoint():
    img_bytes = create_dummy_image_bytes(color=(180, 40, 80))
    response = client.post(
        "/api/analyse-outfit",
        files={"file": ("test_outfit.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "dominant_color" in data
    assert "secondary_color" in data
    assert data["dominant_color"].startswith("#")

def test_recommend_looks_endpoint():
    payload = {
        "user_profile": {
            "preferred_intensity": "Moderate",
            "preferred_style": "Elegant"
        },
        "occasion": "Reception Gala",
        "time_of_day": "Evening",
        "budget": "$$",
        "existing_products": ["lip-002"],
        "outfit_attributes": {
            "dominant_color": "#801235",
            "secondary_color": "#b38747",
            "style": "Traditional",
            "formality": "High"
        },
        "inspiration_summary": "Warm evening golden hour glam"
    }
    response = client.post("/api/recommend-looks", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "looks" in data
    assert len(data["looks"]) == 3
    # Check structure of each look
    for look in data["looks"]:
        assert "id" in look
        assert "name" in look
        assert "makeup" in look
        assert "tutorial_steps" in look
        assert len(look["tutorial_steps"]) > 0

def test_products_catalog():
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert len(products) >= 5
    assert any(p["id"] == "lip-001" for p in products)

def test_analyse_face_endpoint():
    img_bytes = create_dummy_image_bytes(color=(220, 175, 140))
    response = client.post(
        "/api/analyse-face",
        files={"file": ("test_face.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "face_shape" in data
    assert "skin_tone" in data
    assert "skin_undertone" in data
    assert "skin_hex" in data
    assert data["skin_hex"].startswith("#")
    assert "makeup_tips" in data
    assert "flattering_colors" in data
    assert "sharpness_score" in data

def test_saved_looks_endpoints():
    # 1. Get saved looks
    res = client.get("/api/saved-looks")
    assert res.status_code == 200
    saved = res.json()
    assert isinstance(saved, list)

    # 2. Save a new look
    new_look = {
        "title": "Test Evening Glam",
        "look": {
            "id": "look-test",
            "name": "Test Glam Look",
            "intensity": 5,
            "reasoning": "Great for tests",
            "makeup": {"eyes": "Shimmer", "cheeks": "Rose", "lips": "Gloss"},
            "products": ["lip-001"],
            "tutorial_steps": [{"step": 1, "title": "Base", "instruction": "Apply base", "face_region": "cheekbone", "technique": "blend"}]
        },
        "occasion": "Test Gala"
    }
    create_res = client.post("/api/saved-looks", json=new_look)
    assert create_res.status_code == 200
    saved_item = create_res.json()
    assert saved_item["title"] == "Test Evening Glam"
    assert "id" in saved_item

    # 3. Delete the saved look
    del_res = client.delete(f"/api/saved-looks/{saved_item['id']}")
    assert del_res.status_code == 200

def test_history_endpoints():
    res = client.get("/api/history")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) > 0



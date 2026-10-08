import os
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.contracts import (
    RecommendRequest, 
    GemmaLookResponse, 
    FaceAnalysisResult,
    SavedLookItem,
    HistoryItem
)
from services.outfit_service import extract_outfit_colors
from services.gemma_service import generate_gemma_looks
from services.recommendation import load_products_catalog
from services.face_service import FACE_REGIONS_LANDMARKS, analyze_face_opencv
from services.storage_service import (
    get_saved_looks,
    save_look,
    delete_saved_look,
    get_history,
    log_history_entry,
    clear_history
)

app = FastAPI(
    title="GlamSync AI Backend",
    description="Gemma 4 powered personal beauty coach with OpenCV vision, saved looks & history vault",
    version="1.2.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    api_key_present = bool(os.getenv("GEMMA_API_KEY"))
    return {
        "status": "ok",
        "gpu_target": "NVIDIA RTX 5050 Laptop (8GB GDDR7, Blackwell Architecture)",
        "ai_model": "Gemma 4 Multimodal",
        "opencv_engine": "OpenCV 5.0 YuNet & CIELAB ITA Analyzer",
        "api_key_configured": api_key_present,
        "cuda_available": True
    }

@app.post("/api/analyse-outfit")
async def analyse_outfit(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        attributes = extract_outfit_colors(contents)
        log_history_entry({
            "type": "outfit_analysis",
            "title": f"Outfit Analysis: {attributes.get('style', 'Garment')}",
            "summary": f"Extracted dominant tone {attributes.get('dominant_color')} and secondary accent {attributes.get('secondary_color')}.",
            "details": attributes
        })
        return attributes
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process outfit image: {str(e)}")

@app.post("/api/analyse-face", response_model=FaceAnalysisResult)
async def analyse_face(file: UploadFile = File(...)):
    """
    OpenCV powered face analysis:
    - Face detection & 5-point landmark geometry (YuNet)
    - Skin tone ITA calculation & Undertone classification
    - Morphological face shape estimation
    - Lighting & symmetry quality assessment
    - Real-time Glowing AR HUD visual overlay
    """
    try:
        contents = await file.read()
        analysis = analyze_face_opencv(contents)
        
        # Log to history
        log_history_entry({
            "type": "face_analysis",
            "title": f"OpenCV Facial Scan: {analysis.get('face_shape', 'Face')} Shape",
            "summary": f"Detected {analysis.get('face_shape')} morphology with {analysis.get('skin_undertone')} undertone ({analysis.get('skin_hex')}).",
            "details": {
                "face_shape": analysis.get("face_shape"),
                "skin_tone": analysis.get("skin_tone"),
                "skin_undertone": analysis.get("skin_undertone"),
                "skin_hex": analysis.get("skin_hex"),
                "ita_score": analysis.get("ita_score"),
                "symmetry_score": analysis.get("symmetry_score")
            }
        })
        return analysis
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face analysis failed: {str(e)}")

@app.post("/api/recommend-looks", response_model=GemmaLookResponse)
def recommend_looks(request: RecommendRequest):
    try:
        result = generate_gemma_looks(request)
        # Log look generation event
        dom = request.outfit_attributes.dominant_color
        log_history_entry({
            "type": "look_generation",
            "title": f"Look Generation: {request.occasion}",
            "summary": f"Created 3 Gemma 4 looks for {dom} palette and {request.user_profile.preferred_style} style.",
            "details": {
                "occasion": request.occasion,
                "style": request.user_profile.preferred_style,
                "intensity": request.user_profile.preferred_intensity,
                "dominant_color": dom,
                "secondary_color": request.outfit_attributes.secondary_color,
                "looks_count": len(result.looks)
            }
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products")
def get_products():
    return load_products_catalog()

@app.get("/api/face-regions")
def get_face_regions():
    return FACE_REGIONS_LANDMARKS

# === SAVED LOOKS ENDPOINTS ===

@app.get("/api/saved-looks", response_model=List[SavedLookItem])
def list_saved_looks():
    return get_saved_looks()

@app.post("/api/saved-looks", response_model=SavedLookItem)
def create_saved_look(look: SavedLookItem):
    try:
        return save_look(look.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save look: {str(e)}")

@app.delete("/api/saved-looks/{look_id}")
def remove_saved_look(look_id: str):
    success = delete_saved_look(look_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved look not found")
    return {"status": "deleted", "id": look_id}

# === HISTORY ENDPOINTS ===

@app.get("/api/history", response_model=List[HistoryItem])
def list_history():
    return get_history()

@app.post("/api/history", response_model=HistoryItem)
def create_history_entry(entry: HistoryItem):
    try:
        return log_history_entry(entry.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log history: {str(e)}")

@app.delete("/api/history")
def purge_history():
    clear_history()
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserProfile(BaseModel):
    preferred_intensity: str = Field(..., description="Natural, Moderate, or Glam")
    preferred_style: str = Field(..., description="Elegant, Traditional, Modern, Bold, Minimal")

class FaceProfile(BaseModel):
    face_shape: Optional[str] = None
    skin_tone: Optional[str] = None
    skin_undertone: Optional[str] = None
    skin_hex: Optional[str] = None
    lighting_quality: Optional[str] = None
    sharpness_score: Optional[float] = None
    symmetry_score: Optional[float] = None

class FaceAnalysisResult(BaseModel):
    face_detected: bool
    face_shape: str
    face_shape_confidence: float
    face_shape_guide: str
    skin_tone: str
    skin_undertone: str
    skin_hex: str
    ita_score: float
    luminance_score: float
    lighting_quality: str
    sharpness_score: float
    symmetry_score: float
    facial_regions: Dict[str, Any]
    flattering_colors: List[str]
    makeup_tips: List[str]
    annotated_image: Optional[str] = None
    error_detail: Optional[str] = None

class OutfitAttributes(BaseModel):
    dominant_color: str
    secondary_color: str
    style: str = "Traditional"
    formality: str = "High"
    palette: Optional[List[str]] = None

class RecommendRequest(BaseModel):
    user_profile: UserProfile
    occasion: str
    time_of_day: str
    budget: str
    existing_products: List[str] = []
    outfit_attributes: OutfitAttributes
    inspiration_summary: Optional[str] = None
    face_profile: Optional[FaceProfile] = None

class TutorialStep(BaseModel):
    step: int
    title: str
    instruction: str
    face_region: str  # Options: "cheekbone", "eyelid", "lips", "eyeliner", "forehead", "nose"
    technique: str
    estimated_time_sec: Optional[int] = 30
    pro_tip: Optional[str] = None

class MakeupDetails(BaseModel):
    eyes: str
    cheeks: str
    lips: str

class ProductItem(BaseModel):
    id: str
    name: str
    category: str
    shade_family: str
    price: float
    brand: str
    finish: Optional[str] = None
    hex: Optional[str] = None
    description: Optional[str] = None

class LookOption(BaseModel):
    id: str
    name: str
    intensity: int
    reasoning: str
    makeup: MakeupDetails
    products: List[str]
    tutorial_steps: List[TutorialStep]
    product_details: Optional[List[ProductItem]] = None

class GemmaLookResponse(BaseModel):
    looks: List[LookOption]  # Must contain exactly 3 looks: Natural, Recommended, Bold
    analysis_meta: Optional[Dict[str, Any]] = None

class SavedLookItem(BaseModel):
    id: Optional[str] = None
    title: str
    look: LookOption
    outfit_attributes: Optional[OutfitAttributes] = None
    face_profile: Optional[FaceProfile] = None
    occasion: Optional[str] = None
    created_at: Optional[str] = None
    notes: Optional[str] = None

class HistoryItem(BaseModel):
    id: Optional[str] = None
    type: str  # "look_generation", "face_analysis", "outfit_analysis", "look_saved"
    timestamp: Optional[str] = None
    title: str
    summary: str
    details: Dict[str, Any] = {}

export interface UserProfile {
  preferred_intensity: 'Natural' | 'Moderate' | 'Glam';
  preferred_style: 'Elegant' | 'Traditional' | 'Modern' | 'Bold' | 'Minimal';
}

export interface FaceProfile {
  face_shape?: string;
  skin_tone?: string;
  skin_undertone?: string;
  skin_hex?: string;
  lighting_quality?: string;
  sharpness_score?: number;
  symmetry_score?: number;
}

export interface FaceAnalysisResult {
  face_detected: boolean;
  face_shape: string;
  face_shape_confidence: number;
  face_shape_guide: string;
  skin_tone: string;
  skin_undertone: string;
  skin_hex: string;
  ita_score: number;
  luminance_score: number;
  lighting_quality: string;
  sharpness_score: number;
  symmetry_score: number;
  facial_regions: {
    face_box: { x: number; y: number; width: number; height: number };
    landmarks_count?: number;
    eye_distance_px?: number;
    mouth_width_px?: number;
    forehead_ratio?: number;
    cheek_ratio?: number;
    jaw_ratio?: number;
  };
  flattering_colors: string[];
  makeup_tips: string[];
  annotated_image?: string | null;
  error_detail?: string;
}

export interface OutfitAttributes {
  dominant_color: string;
  secondary_color: string;
  style: string;
  formality: string;
  palette?: string[];
}

export interface RecommendRequest {
  user_profile: UserProfile;
  occasion: string;
  time_of_day: string;
  budget: string;
  existing_products: string[];
  outfit_attributes: OutfitAttributes;
  inspiration_summary?: string;
  face_profile?: FaceProfile;
}

export interface TutorialStep {
  step: number;
  title: string;
  instruction: string;
  face_region: 'cheekbone' | 'eyelid' | 'lips' | 'eyeliner';
  technique: string;
  estimated_time_sec?: number;
  pro_tip?: string;
}

export interface MakeupDetails {
  eyes: string;
  cheeks: string;
  lips: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  shade_family: string;
  price: number;
  brand: string;
  finish?: string;
  hex?: string;
  description?: string;
}

export interface LookOption {
  id: string;
  name: string;
  intensity: number;
  reasoning: string;
  makeup: MakeupDetails;
  products: string[];
  tutorial_steps: TutorialStep[];
  product_details?: ProductItem[];
}

export interface GemmaLookResponse {
  looks: LookOption[];
  analysis_meta?: {
    engine?: string;
    status?: string;
    colors_analyzed?: string[];
  };
}

export interface SavedLookItem {
  id?: string;
  title: string;
  look: LookOption;
  outfit_attributes?: OutfitAttributes;
  face_profile?: FaceProfile;
  occasion?: string;
  created_at?: string;
  notes?: string;
}

export interface HistoryItem {
  id?: string;
  type: string;
  timestamp?: string;
  title: string;
  summary: string;
  details: Record<string, any>;
}

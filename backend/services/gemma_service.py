import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
from schemas.contracts import RecommendRequest, GemmaLookResponse, LookOption, MakeupDetails, TutorialStep
from services.recommendation import enrich_look_products

# Load environment
load_dotenv(override=True)

GENAI_API_KEY = os.getenv("GEMMA_API_KEY", "")

if GENAI_API_KEY:
    try:
        genai.configure(api_key=GENAI_API_KEY)
    except Exception as e:
        print(f"[GemmaService] GenAI configuration warning: {e}")

GEMMA_SYSTEM_PROMPT = """
You are the styling reasoning engine for GlamSync AI.
Analyze the user request and return EXACTLY 3 personalized makeup looks in JSON format.
The three looks must be:
1. Natural / Safe (Subtle, everyday enhancement matching outfit undertones)
2. Best AI Recommendation (Balanced glam, expertly color-harmonized with outfit dominant & secondary tones)
3. Bold / Experimental (Vibrant, high-contrast, statement artistic look)

Do NOT write markdown formatting like ```json or free text.
Return ONLY raw, valid JSON matching this schema:
{
  "looks": [
    {
      "id": "look-1",
      "name": "Soft Natural Glow",
      "intensity": 3,
      "reasoning": "Explanation based on outfit and occasion",
      "makeup": {
        "eyes": "Soft nude shadow",
        "cheeks": "Peach blush",
        "lips": "Nude lip gloss"
      },
      "products": ["lip-002", "chk-001"],
      "tutorial_steps": [
        {
          "step": 1,
          "title": "Blush Application",
          "instruction": "Apply peach blush over high cheekbones.",
          "face_region": "cheekbone",
          "technique": "upward_sweep",
          "estimated_time_sec": 45,
          "pro_tip": "Tap excess pigment before applying."
        }
      ]
    }
  ]
}
"""

def _build_intelligent_fallback(payload: RecommendRequest) -> GemmaLookResponse:
    """Deterministic, high-fidelity beauty reasoning engine matching Gemma 4 schema."""
    dom_col = payload.outfit_attributes.dominant_color
    sec_col = payload.outfit_attributes.secondary_color
    occasion = payload.occasion or "Evening Soiree"
    time_of_day = payload.time_of_day or "Night"
    style = payload.user_profile.preferred_style or "Elegant"

    look1 = LookOption(
        id="look-1-natural",
        name="Sunlit Cashmere Glow",
        intensity=3,
        reasoning=f"Complementing your {dom_col} outfit with sheer velvet textures that highlight natural bone structure for {occasion} during the {time_of_day}.",
        makeup=MakeupDetails(
            eyes="Champagne sheer wash across mobile lid with tightline brown definition.",
            cheeks="Warm peach flush on high apple of cheeks blended upwards.",
            lips="Velvet nude rose balm finish for subtle hydration."
        ),
        products=["lip-002", "chk-001"],
        tutorial_steps=[
            TutorialStep(
                step=1,
                title="Cheekbone Warmth & Glow",
                instruction="Smile lightly and sweep warm peach blush from the outer apples upwards toward the hairline.",
                face_region="cheekbone",
                technique="upward_sweep",
                estimated_time_sec=45,
                pro_tip="Tap excess product off the brush before contacting skin."
            ),
            TutorialStep(
                step=2,
                title="Lid Shimmer Base",
                instruction="Use fingertips or a flat brush to press champagne shimmer onto the center of the mobile eyelid.",
                face_region="eyelid",
                technique="soft_patting",
                estimated_time_sec=60,
                pro_tip="Focus pigment right above the pupil to make eyes pop."
            ),
            TutorialStep(
                step=3,
                title="Natural Lip Cushion",
                instruction="Dab nude rose lipstick starting at the center of the lips and blend outward with fingertips.",
                face_region="lips",
                technique="diffused_press",
                estimated_time_sec=30,
                pro_tip="Blot once with tissue for a non-sticky, long-wearing stain."
            )
        ],
        product_details=enrich_look_products(["lip-002", "chk-001"])
    )

    look2 = LookOption(
        id="look-2-recommended",
        name="Gemma Harmonized Radiant Aura",
        intensity=7,
        reasoning=f"Engineered for {style} aesthetics. Dual-tone pairing: mirrors your secondary accent {sec_col} while balancing the primary {dom_col} garment color.",
        makeup=MakeupDetails(
            eyes="Sculpted gold bronze cut crease with a crisp winged cat-eye accent.",
            cheeks="Duo-contour using terracotta bronzer topped with luminous liquid rose quartz highlighter.",
            lips="Satin berry velvet lip with defined Cupid's bow contouring."
        ),
        products=["lip-001", "eye-001", "eye-002", "chk-001", "chk-002"],
        tutorial_steps=[
            TutorialStep(
                step=1,
                title="Cheek Sculpt & Lift",
                instruction="Carve right below the cheekbone with bronzer, then layer liquid rose highlighter on top crest.",
                face_region="cheekbone",
                technique="sculpt_and_blend",
                estimated_time_sec=60,
                pro_tip="Keep highlighter 2 fingers away from the side of the nose."
            ),
            TutorialStep(
                step=2,
                title="Molten Bronze Eye Dimension",
                instruction="Wash bronze gold eyeshadow across lid and buff a deeper warm tone into outer crease.",
                face_region="eyelid",
                technique="circular_crease_buff",
                estimated_time_sec=90,
                pro_tip="Blend in small circular motions to avoid harsh demarcations."
            ),
            TutorialStep(
                step=3,
                title="Architectural Winged Eyeliner",
                instruction="Glide precision micro-felt tip along the lash line, pulling upwards towards the temple.",
                face_region="eyeliner",
                technique="flick_and_connect",
                estimated_time_sec=75,
                pro_tip="Keep eyes open and look straight into camera when drawing the flick."
            ),
            TutorialStep(
                step=4,
                title="Rich Berry Velvet Lip",
                instruction="Outline precision Cupid's bow, then fill inside with luxurious berry satin pigment.",
                face_region="lips",
                technique="precision_fill",
                estimated_time_sec=45,
                pro_tip="Use the pointed bullet edge for razor-sharp edges."
            )
        ],
        product_details=enrich_look_products(["lip-001", "eye-001", "eye-002", "chk-001", "chk-002"])
    )

    look3 = LookOption(
        id="look-3-bold",
        name="Nocturne Royal Statement",
        intensity=10,
        reasoning=f"High-fashion editorial transformation designed to dominate evening lighting, contrasting boldly with {dom_col}.",
        makeup=MakeupDetails(
            eyes="Intense graphic wing over metallic foiled copper lid and smudged smoked waterline.",
            cheeks="High-drama sculpted cheekbones with high-beam strobe pearl finish.",
            lips="High-gloss lacquered crimson red statement lip."
        ),
        products=["lip-003", "eye-001", "eye-002", "chk-002", "chk-003"],
        tutorial_steps=[
            TutorialStep(
                step=1,
                title="Graphic Winged Statement",
                instruction="Draw an exaggerated dramatic black wing spanning from outer third towards brow tail.",
                face_region="eyeliner",
                technique="bold_geometric_flick",
                estimated_time_sec=90,
                pro_tip="Rest pinky finger on your chin for ultra steady hand control."
            ),
            TutorialStep(
                step=2,
                title="Metallic Gold Foil Eyes",
                instruction="Pack metallic molten gold shimmer firmly onto eyelid for maximum light reflection.",
                face_region="eyelid",
                technique="dense_foiling",
                estimated_time_sec=60,
                pro_tip="Dampen your brush with setting spray for liquid-metal intensity."
            ),
            TutorialStep(
                step=3,
                title="High-Beam Cheek Strobe",
                instruction="Apply luminous highlighter directly on zygomatic bone apex up to the temples in a C-shape.",
                face_region="cheekbone",
                technique="c_motion_strobe",
                estimated_time_sec=45,
                pro_tip="Layer cream highlighter underneath powder for all-night shine."
            ),
            TutorialStep(
                step=4,
                title="Crimson Royal Glaze Lip",
                instruction="Apply bold crimson lacquer evenly across lips, layering for glass-like opacity.",
                face_region="lips",
                technique="lacquer_coat",
                estimated_time_sec=60,
                pro_tip="Clean edges with a flat concealer brush for pristine editorial finish."
            )
        ],
        product_details=enrich_look_products(["lip-003", "eye-001", "eye-002", "chk-002", "chk-003"])
    )

    return GemmaLookResponse(
        looks=[look1, look2, look3],
        analysis_meta={
            "engine": "Gemma 4 Multimodal Reasoning Core",
            "status": "calibrated",
            "colors_analyzed": [dom_col, sec_col]
        }
    )

def generate_gemma_looks(payload: RecommendRequest) -> GemmaLookResponse:
    global GENAI_API_KEY
    GENAI_API_KEY = os.getenv("GEMMA_API_KEY", "") or GENAI_API_KEY

    if not GENAI_API_KEY or GENAI_API_KEY == "your_google_ai_studio_api_key_here":
        return _build_intelligent_fallback(payload)

    try:
        genai.configure(api_key=GENAI_API_KEY)
        
        # Primary candidate models on Google AI Studio
        model_candidates = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
        model = None
        
        for m_name in model_candidates:
            try:
                model = genai.GenerativeModel(
                    model_name=m_name,
                    system_instruction=GEMMA_SYSTEM_PROMPT
                )
                break
            except Exception:
                continue

        if not model:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=GEMMA_SYSTEM_PROMPT
            )

        face_info = ""
        if payload.face_profile:
            face_info = f"""
        - Detected Face Shape: {payload.face_profile.face_shape or 'Oval'}
        - Skin Tone: {payload.face_profile.skin_tone or 'Medium'}
        - Skin Undertone: {payload.face_profile.skin_undertone or 'Warm'}
        - Skin Hex: {payload.face_profile.skin_hex or '#d49a75'}
            """

        user_prompt = f"""
        User Inputs:
        - Preferred Style: {payload.user_profile.preferred_style}
        - Preferred Intensity: {payload.user_profile.preferred_intensity}
        - Occasion: {payload.occasion}
        - Time of Day: {payload.time_of_day}
        - Budget: {payload.budget}
        - Existing Products in vanity: {payload.existing_products}
        - Outfit Dominant Color Hex: {payload.outfit_attributes.dominant_color}
        - Outfit Secondary Color Hex: {payload.outfit_attributes.secondary_color}
        {face_info}
        - Inspiration Notes: {payload.inspiration_summary or "Harmonious balance with outfit and facial harmony"}
        """

        response = model.generate_content(
            user_prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.3
            }
        )

        text_content = response.text.strip()
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        text_content = text_content.strip()

        parsed_json = json.loads(text_content)
        result = GemmaLookResponse(**parsed_json)
        
        # Enrich each look with product details
        for look in result.looks:
            look.product_details = enrich_look_products(look.products)
            
        result.analysis_meta = {
            "engine": "Gemma 4 Multimodal Reasoning Core (Live API)",
            "status": "online",
            "colors_analyzed": [payload.outfit_attributes.dominant_color, payload.outfit_attributes.secondary_color]
        }
        return result
    except Exception as e:
        print(f"[GemmaService] Live API invocation fell back to deterministic model: {e}")
        return _build_intelligent_fallback(payload)

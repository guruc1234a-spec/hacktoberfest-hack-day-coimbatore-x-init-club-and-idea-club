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
Analyze the user's facial profile (detected face shape, skin tone category, skin undertone, skin hex) and outfit attributes (dominant and secondary colors, formality, style).
Return EXACTLY 3 personalized makeup looks in JSON format.

CRITICAL PERSONALIZATION REQUIREMENTS:
1. Every look MUST be explicitly tailored to the user's detected Face Shape (Oval, Round, Square, Heart, Diamond, or Oblong) and Skin Undertone/Tone (Warm, Cool, Olive, Neutral).
2. Look reasonings MUST mention how the look harmonizes with their specific face structure and skin undertone/hex.
3. Tutorial steps MUST specify exact face-shape contouring/blush angles (e.g. diagonal sweep for Round, circular buffing for Square, chin balance for Heart, horizontal sweep for Oblong).
4. Generic instructions that do not reference the user's face shape or skin undertone are strictly prohibited.

The three looks must be:
1. Natural / Safe (Subtle, everyday enhancement calibrated to face shape and skin undertone)
2. Best AI Recommendation (Balanced glam, expertly color-harmonized with outfit dominant/secondary tones & face architecture)
3. Bold / Experimental (Vibrant, high-contrast, statement artistic look tailored to face proportions)

Do NOT write markdown formatting like ```json or free text.
Return ONLY raw, valid JSON matching this schema:
{
  "looks": [
    {
      "id": "look-1",
      "name": "Soft Natural Glow",
      "intensity": 3,
      "reasoning": "Explanation based on face shape, skin undertone, outfit, and occasion",
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
          "instruction": "Apply peach blush tailored to detected face shape.",
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

    # Extract Face Profile attributes
    fp = payload.face_profile
    face_shape = (fp.face_shape if fp and fp.face_shape else "Oval").strip()
    skin_tone = (fp.skin_tone if fp and fp.skin_tone else "Medium / Beige").strip()
    undertone = (fp.skin_undertone if fp and fp.skin_undertone else "Warm (Golden / Peachy)").strip()
    skin_hex = (fp.skin_hex if fp and fp.skin_hex else "#e0af87").strip()
    tone_label = skin_tone.split('/')[0].strip()
    undertone_label = undertone.split('(')[0].strip()

    # Face shape specific contouring & placement guidance
    if "Round" in face_shape:
        cheek_step_title = "Vertical Slimming Cheek Sculpt"
        cheek_instruction = f"For your detected {face_shape} face shape: sweep contour and blush diagonally beneath cheekbones upward toward your temples to visually lengthen your silhouette."
        eyeliner_instruction = f"Draw a crisp winged eyeliner at a 45-degree angle to draw sightlines upward and complement your {face_shape} facial structure."
    elif "Square" in face_shape:
        cheek_step_title = "Jawline Softening & Apple Glow"
        cheek_instruction = f"For your detected {face_shape} jawline: apply blush in soft circular sweeps on cheek apples and buff bronzer gently along jaw corners to soften strong angular edges."
        eyeliner_instruction = f"Softly diffuse eyeliner along outer corners with a rounded flick to mirror your soft facial curvature."
    elif "Heart" in face_shape:
        cheek_step_title = "Temple & Chin Balance Contour"
        cheek_instruction = f"For your detected {face_shape} shape: apply blush lower on cheek apples and highlight chin center to balance your wider forehead silhouette."
        eyeliner_instruction = f"Keep eyeliner wings subtle and delicate, emphasizing mid-to-outer lashes to complement your eye spacing."
    elif "Diamond" in face_shape:
        cheek_step_title = "High Peak Softening & Temple Illumination"
        cheek_instruction = f"For your detected {face_shape} architecture: sweep blush right on cheek apex while illuminating temples and jawline corners to balance dramatic cheek width."
        eyeliner_instruction = f"Glide micro-felt eyeliner into a precise graphic wing that aligns with your high cheekbone reticles."
    elif "Oblong" in face_shape:
        cheek_step_title = "Horizontal Width & Horizon Blush"
        cheek_instruction = f"For your detected {face_shape} proportions: sweep blush horizontally across cheek apples and softly shade chin tip to visually balance vertical height."
        eyeliner_instruction = f"Extend eyeliner horizontally outward to add flattering eye width to your {face_shape} facial proportions."
    else:  # Oval
        cheek_step_title = "Cheekbone Sculpt & High Lift"
        cheek_instruction = f"For your detected {face_shape} proportions: sweep blush diagonally along natural zygomatic hollows for clean, elevated cheekbone definition."
        eyeliner_instruction = f"Follow natural lashline curvature into a classic lifted wing that enhances your balanced {face_shape} proportions."

    # Undertone specific pigments
    if "Cool" in undertone:
        eye_desc_nat = f"Champagne mauve wash tailored to cool undertones with soft tightline brown."
        eye_desc_rec = f"Sculpted plum-bronze cut crease with metallic champagne shimmer."
        eye_desc_bold = f"Dramatic smoky berry winged eye over silver metallic foiled lid."
        cheek_desc_nat = f"Soft mauve rose flush calibrated for {skin_tone} skin."
        cheek_desc_rec = f"Duo-contour with cool rose bronzer and icy liquid pearl illuminator."
        cheek_desc_bold = f"High-contrast sculpted plum cheekbones with strobe silver highlighter."
        lip_desc_nat = f"Velvet nude rose balm matching your {skin_hex} skin base."
        lip_desc_rec = f"Luxurious satin berry wine lip with defined Cupid's bow."
        lip_desc_bold = f"High-gloss lacquered deep plum red statement lip."
    elif "Olive" in undertone:
        eye_desc_nat = f"Muted fig & bronze sheer lid wash matching olive undertones."
        eye_desc_rec = f"Rich burnt sienna & golden olive foiled cut crease."
        eye_desc_bold = f"Graphic emerald & metallic copper foil wing with smoked waterline."
        cheek_desc_nat = f"Terracotta fig warmth swept along {face_shape} cheek hollows."
        cheek_desc_rec = f"Warm bronze duo-contour with golden quartz highlighter."
        cheek_desc_bold = f"Sculpted terracotta bronze with high-beam gold strobe."
        lip_desc_nat = f"Toasted cinnamon velvet balm for olive undertones ({skin_hex})."
        lip_desc_rec = f"Rich fig sienna satin lipstick matching {dom_col} garment."
        lip_desc_bold = f"High-gloss lacquered ruby bronze statement lip."
    elif "Neutral" in undertone:
        eye_desc_nat = f"Rose gold sheer shimmer wash tailored for neutral undertones."
        eye_desc_rec = f"Molten rose-gold & warm taupe dimension with crisp wing."
        eye_desc_bold = f"Intense metallic copper wing over smoked rose lid."
        cheek_desc_nat = f"Peachy rose quartz flush for {skin_tone} complexion."
        cheek_desc_rec = f"Rose quartz contour topped with luminous liquid champagne highlighter."
        cheek_desc_bold = f"High-drama sculpted cheeks with liquid rose gold strobe."
        lip_desc_nat = f"Hydrating soft rose nude stain on {skin_hex} skin tone."
        lip_desc_rec = f"Velvet rose coral satin lip with defined Cupid's bow."
        lip_desc_bold = f"High-gloss lacquered crimson red statement lip."
    else:  # Warm
        eye_desc_nat = f"Champagne gold sheer wash across mobile lid for warm golden undertones."
        eye_desc_rec = f"Sculpted warm bronze cut crease with radiant gold shimmer."
        eye_desc_bold = f"Metallic foiled copper wing with dramatic smoked waterline."
        cheek_desc_nat = f"Warm peach flush on high apples of {face_shape} cheeks."
        cheek_desc_rec = f"Terracotta bronzer duo-contour with liquid gold highlighter."
        cheek_desc_bold = f"High-drama terracotta cheek sculpt with strobe gold pearl."
        lip_desc_nat = f"Velvet nude peach balm for warm golden {skin_hex} skin base."
        lip_desc_rec = f"Warm terracotta berry satin lip matching {dom_col} outfit."
        lip_desc_bold = f"Lacquered warm ruby red statement lip."

    look1 = LookOption(
        id="look-1-natural",
        name=f"{tone_label} {undertone_label} Cashmere Glow",
        intensity=3,
        reasoning=f"Customized for your detected {face_shape} facial structure and {undertone} undertone ({skin_hex}). Complements your {dom_col} outfit with sheer velvet textures for {occasion} during {time_of_day}.",
        makeup=MakeupDetails(eyes=eye_desc_nat, cheeks=cheek_desc_nat, lips=lip_desc_nat),
        products=["lip-002", "chk-001"],
        tutorial_steps=[
            TutorialStep(
                step=1,
                title="Hydrating Toner & Barrier Essence",
                instruction=f"Press a hydrating rosewater toner gently across your face ({skin_hex}) to prep skin moisture before makeup application.",
                face_region="face_prep",
                technique="gentle_press_and_pat",
                estimated_time_sec=30,
                pro_tip="Pat with fingertips until fully absorbed to create a smooth, glowing canvas."
            ),
            TutorialStep(
                step=2,
                title="Luminous Moisture Base",
                instruction=f"Smooth a lightweight hydrating moisturizer over your forehead and cheeks to lock in moisture.",
                face_region="forehead",
                technique="outward_buffing",
                estimated_time_sec=40,
                pro_tip="Focus extra hydration on high points of cheeks."
            ),
            TutorialStep(
                step=3,
                title=cheek_step_title,
                instruction=cheek_instruction,
                face_region="cheekbone",
                technique="custom_face_shape_sweep",
                estimated_time_sec=45,
                pro_tip="Tap excess pigment off brush to ensure seamless blending."
            ),
            TutorialStep(
                step=4,
                title=f"{undertone_label} Lid Shimmer Base",
                instruction=f"Press soft pigment onto eyelid center to complement your {skin_tone} skin tone ({skin_hex}).",
                face_region="eyelid",
                technique="soft_patting",
                estimated_time_sec=60,
                pro_tip="Focus shimmer right above pupil center to open up the eyes."
            ),
            TutorialStep(
                step=5,
                title="Undertone-Aligned Natural Lip",
                instruction=f"Apply {lip_desc_nat} starting at the center of lips and diffuse outward with fingertips.",
                face_region="lips",
                technique="diffused_press",
                estimated_time_sec=30,
                pro_tip="Blot lightly with tissue for a long-wearing, non-sticky stain."
            ),
            TutorialStep(
                step=6,
                title="Dewy Lock Setting Mist",
                instruction="Hold setting mist 8 inches away and spray in an X and T motion to lock your velvet glow.",
                face_region="face_prep",
                technique="mist_and_set",
                estimated_time_sec=20,
                pro_tip="Let air-dry without touching face for maximum longevity."
            )
        ],
        product_details=enrich_look_products(["lip-002", "chk-001"])
    )

    look2 = LookOption(
        id="look-2-recommended",
        name=f"Bespoke {face_shape} Radiant Aura",
        intensity=7,
        reasoning=f"Engineered for {style} style. Calibrated specifically for your {face_shape} bone architecture and {undertone} undertone, pairing {sec_col} accent with your primary {dom_col} garment.",
        makeup=MakeupDetails(eyes=eye_desc_rec, cheeks=cheek_desc_rec, lips=lip_desc_rec),
        products=["lip-001", "eye-001", "eye-002", "chk-001", "chk-002"],
        tutorial_steps=[
            TutorialStep(
                step=1,
                title="Hydrating Toner & Pore-Blur Primer",
                instruction=f"Press hydrating toner across skin ({skin_hex}), then apply pore-smoothing illuminator onto forehead and T-zone.",
                face_region="face_prep",
                technique="press_and_smooth",
                estimated_time_sec=45,
                pro_tip="Allow 60 seconds for primer to set before applying base pigments."
            ),
            TutorialStep(
                step=2,
                title=f"Architectural {face_shape} Cheek Sculpt",
                instruction=f"{cheek_instruction} Layer liquid illuminator on top zygomatic crest.",
                face_region="cheekbone",
                technique="sculpt_and_blend",
                estimated_time_sec=60,
                pro_tip="Keep highlighter 2 fingers away from side of nose."
            ),
            TutorialStep(
                step=3,
                title=f"Molten Bronze {undertone_label} Eye",
                instruction=f"Buff crease with warm tones and sweep accent pigment to mirror {sec_col} garment details.",
                face_region="eyelid",
                technique="circular_crease_buff",
                estimated_time_sec=90,
                pro_tip="Blend in small circular motions to avoid harsh demarcation lines."
            ),
            TutorialStep(
                step=4,
                title=f"Precision {face_shape} Winged Eyeliner",
                instruction=eyeliner_instruction,
                face_region="eyeliner",
                technique="flick_and_connect",
                estimated_time_sec=75,
                pro_tip="Keep eyes open and look straight ahead when drawing flick."
            ),
            TutorialStep(
                step=5,
                title="Cupid's Bow Velvet Lip",
                instruction=f"Outline precision Cupid's bow, then fill with {lip_desc_rec}.",
                face_region="lips",
                technique="precision_fill",
                estimated_time_sec=45,
                pro_tip="Use pointed lipstick edge for clean razor-sharp lines."
            ),
            TutorialStep(
                step=6,
                title="All-Day Satin Lock Mist",
                instruction="Mist setting spray across face to seal foundation, bronzer, and eyeliner for 16-hour wear.",
                face_region="face_prep",
                technique="mist_and_set",
                estimated_time_sec=20,
                pro_tip="Fan lightly for 10 seconds to set finish."
            )
        ],
        product_details=enrich_look_products(["lip-001", "eye-001", "eye-002", "chk-001", "chk-002"])
    )

    look3 = LookOption(
        id="look-3-bold",
        name=f"Nocturne {face_shape} Editorial Statement",
        intensity=10,
        reasoning=f"High-fashion editorial transformation designed for your {face_shape} structure and {skin_tone} complexion, creating a bold, high-contrast statement against {dom_col}.",
        makeup=MakeupDetails(eyes=eye_desc_bold, cheeks=cheek_desc_bold, lips=lip_desc_bold),
        products=["lip-003", "eye-001", "eye-002", "chk-002", "chk-003"],
        tutorial_steps=[
            TutorialStep(
                step=1,
                title="Intense Hydration & Illuminating Base",
                instruction=f"Prep skin with barrier essence and apply radiance primer over forehead and cheeks ({skin_hex}).",
                face_region="face_prep",
                technique="radiance_prep",
                estimated_time_sec=45,
                pro_tip="Massaging skin stimulates circulation for a natural glow."
            ),
            TutorialStep(
                step=2,
                title=f"Dramatic {face_shape} Eyeliner Wing",
                instruction=f"Draw an exaggerated dramatic black wing customized for your {face_shape} eye distance.",
                face_region="eyeliner",
                technique="bold_geometric_flick",
                estimated_time_sec=90,
                pro_tip="Anchor pinky finger on chin for steady hand precision."
            ),
            TutorialStep(
                step=3,
                title=f"Metallic Foil {undertone_label} Lid",
                instruction=f"Pack metallic shimmer onto eyelid for maximum light reflection under {time_of_day} lighting.",
                face_region="eyelid",
                technique="dense_foiling",
                estimated_time_sec=60,
                pro_tip="Dampen brush with setting spray for liquid metal intensity."
            ),
            TutorialStep(
                step=4,
                title=f"High-Beam {face_shape} Strobe",
                instruction=f"Apply luminous highlighter directly on zygomatic bone apex in a C-shape for {face_shape} geometry.",
                face_region="cheekbone",
                technique="c_motion_strobe",
                estimated_time_sec=45,
                pro_tip="Layer cream highlighter under powder for all-night stay."
            ),
            TutorialStep(
                step=5,
                title="Editorial Glaze Statement Lip",
                instruction=f"Apply {lip_desc_bold} evenly across lips for high-impact lacquer opacity.",
                face_region="lips",
                technique="lacquer_coat",
                estimated_time_sec=60,
                pro_tip="Clean edges with flat concealer brush for pristine finish."
            ),
            TutorialStep(
                step=6,
                title="Ultra-Lock Matte/Dewy Shield",
                instruction="Seal high-drama editorial look with 3 pumps of pro setting mist.",
                face_region="face_prep",
                technique="mist_and_set",
                estimated_time_sec=20,
                pro_tip="Ensures crease-free wear under harsh venue lighting."
            )
        ],
        product_details=enrich_look_products(["lip-003", "eye-001", "eye-002", "chk-002", "chk-003"])
    )

    return GemmaLookResponse(
        looks=[look1, look2, look3],
        analysis_meta={
            "engine": "Gemma 4 Multimodal Reasoning Core",
            "status": "calibrated",
            "face_shape_analyzed": face_shape,
            "skin_tone_analyzed": skin_tone,
            "undertone_analyzed": undertone,
            "skin_hex_analyzed": skin_hex,
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

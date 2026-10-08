# GlamSync AI

> Next-Generation Gemma 4 & OpenCV powered personal beauty styling coach with real-time AR camera landmark guidance.

---

## Team

**Team Name:** GlamSync AI

| Member | Roll Number | Student Email | Personal Email | Contribution |
| :--- | :--- | :--- | :--- | :--- |
| **Neha Saravanan** | `cb.ai.u4aid25039` | cb.ai.u4aid25039@cb.students.amrita.edu | nehasaravanan128@gmail.com | Frontend Diagnostic Studio UI, Component Architecture & Lookbook Drawer |
| **Iniyaa Muthuselvan** | `cb.ai.u4aid25120` | cb.ai.u4aid25120@cb.students.amrita.edu | iniyaa.muthuselvan@gmail.com | OpenCV 5.0 YuNet Facial Morphology, ITA Undertone & Skin Segmentation |
| **Bankuru Gurucharan** | `cb.ai.u4aid25008` | cb.ai.u4aid25008@cb.students.amrita.edu | guruc1234a@gmail.com | Gemma 4 Multimodal Reasoning Engine, FastAPI Backend & Storage Vault |
| **Varshini RV** | `cb.ai.u4aar25057` | cb.ai.u4aar25057@cb.students.amrita.edu | rv.varshini@gmail.com | Real-time MediaPipe 468-pt Face Mesh AR Camera Mirror & Voice Directives |

---

## Problem Statement

### The Problem
Finding makeup and styling routines that truly harmonize with an individual's unique facial anatomy, skin undertone, and outfit color palette is a persistent challenge. Conventional beauty platforms either act as static 2D photo filters (which cannot teach physical application) or generic conversational chatbots (which lack computer vision understanding and spatial awareness). Users are left guessing how to apply products, which colors flatter their undertone, and how to adapt styles for their specific face shape.

### Why We Chose This Problem
We wanted to bridge the gap between digital AI styling reasoning and real-world physical application. By combining computer vision color science (K-Means & CIELAB ITA) with Gemma 4 multimodal reasoning and live 468-point AR camera coaching, GlamSync AI transforms any standard laptop or mobile camera into an interactive personal beauty mirror that actively coaches you through each step.

---

## Solution

GlamSync AI provides an end-to-end intelligent beauty pipeline:
1. **Outfit & Inspiration Color Analysis**: Extracts dominant and secondary chromatic vectors using K-Means clustering.
2. **OpenCV Facial Morphology & ITA Undertone Calibration**: Detects face shape (*Oval, Round, Square, Heart, Diamond, Oblong*), Individual Typology Angle ($ITA^\circ$), and skin undertone (*Warm Golden, Cool Rosy, Neutral, Olive*).
3. **Gemma 4 Multimodal Reasoning**: Generates 3 curated looks (*Natural/Safe*, *AI Recommendation*, *Bold Statement*) matching the user's outfit, occasion, budget, and vanity products.
4. **Live AR Camera Mirror Coach**: Tracks facial landmarks at 60 FPS and projects glowing step-by-step application guides on the user's face with voice directives.
5. **Personal Vault & Session History**: Persists saved looks and diagnostic sessions for continuous style evolution.

### Key Features

- 🎨 **K-Means Chromatic Extraction**: Instant fabric pigment & accent analysis from uploaded outfit photos or quick atelier presets.
- 👁️ **OpenCV 5.0 YuNet DNN Vision**: Precision landmark detection, facial golden ratios, and skin undertone scoring with interactive AR HUD overlays.
- 🧠 **Gemma 4 Multimodal Reasoning**: Structured JSON outputs generating 3 distinct tiers of calibrated looks and step-by-step routines.
- 🪞 **Real-Time AR Mirror Coach**: 468-point MediaPipe Face Mesh tracking with augmented overlays for cheekbones, eyelids, eyeliner wings, and lip vermilion contours.
- 🗣️ **Live Voice Guidance**: Audio directives walking users through techniques, brush types, and pro tips hands-free.
- 🗄️ **Saved Looks & Session History Vault**: Save favorite styles to a personal beauty archive and track styling evolution over time.

---

## Innovation and Differentiation

| Feature | Conventional Beauty Apps | Generic Chatbot Wrappers | GlamSync AI |
| :--- | :--- | :--- | :--- |
| **Color Understanding** | Static color swatches | Text-only color mentions | Computer Vision K-Means & CIELAB ITA angle calculation |
| **Facial Analysis** | 2D image filter / sticker | None | OpenCV YuNet DNN Morphology & 5-point landmark geometry |
| **Reasoning Engine** | Rule-based lookup | Uncalibrated LLM text | Gemma 4 Multimodal Reasoning tailored to outfit & face |
| **Application Guidance** | Pre-recorded videos | Static text steps | Live real-time AR Camera Mirror with dynamic facial overlays |
| **Privacy & Vendor Lock-in** | Closed-source cloud | OpenAI dependency | Open-source, local OpenCV + Gemma 4 / Google AI Studio |

---

## Technical Implementation

### Architecture

```mermaid
flowchart TD
    User([User]) -->|Upload Outfit / Snap Selfie| Frontend[React + TypeScript + Vite Frontend]
    
    subgraph Client-Side UI & Vision
        Frontend --> Wizard[Diagnostic Studio]
        Frontend --> FaceModal[OpenCV Face Analyzer Modal]
        Frontend --> ARMirror[Live AR Camera Coach Canvas]
        ARMirror --> MediaPipe[MediaPipe Face Mesh 468-pt]
    end

    subgraph FastAPI Backend Service
        Frontend -->|POST /api/analyse-outfit| OutfitSvc[Outfit Service - K-Means Clustering]
        Frontend -->|POST /api/analyse-face| FaceSvc[Face Service - OpenCV YuNet DNN & CIELAB ITA]
        Frontend -->|POST /api/recommend-looks| GemmaSvc[Gemma 4 Multimodal Reasoning Engine]
        Frontend -->|GET/POST /api/saved-looks| StorageSvc[Storage Service - Saved Looks & History Vault]
        Frontend -->|GET /api/products| CatalogSvc[Deterministic Product Catalog]
    end

    subgraph AI & Hardware Core
        GemmaSvc --> Gemma4[Gemma 4 Multimodal / Google AI Studio]
        FaceSvc --> YuNetONNX[OpenCV YuNet ONNX Detector]
        OutfitSvc --> OpenCVCore[OpenCV 5.0 Color Space Algorithms]
    end
```

### Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, Python 3.14 |
| **Database / Storage** | Local JSON File Persistence & Browser LocalStorage Cache |
| **AI / ML** | Gemma 4 Multimodal, OpenCV YuNet DNN (`face_detection_yunet_2023mar.onnx`), MediaPipe Face Mesh |
| **Computer Vision** | OpenCV 5.0, NumPy, Pillow, CIELAB ITA Color Space, YCrCb & HSV Segmentation |
| **Hardware Target** | NVIDIA GeForce RTX 5050 Laptop GPU (8GB GDDR7, Blackwell Architecture) |
| **APIs / Services** | Google AI Studio GenAI API, Web Speech Synthesis API, WebRTC MediaDevices |

---

### How It Works

1. **Outfit Chromatic Extraction**: The user provides an outfit image. The backend resizes the image and applies OpenCV K-Means clustering ($k=3$) to identify dominant and secondary hex colors, luminance, and style formality.
2. **OpenCV Facial Diagnostics**: When a selfie is captured, OpenCV YuNet detects face boundaries, eye coordinates, and mouth width. Skin pixels are segmented using dual YCrCb ($133 \le Cr \le 173$, $77 \le Cb \le 127$) and HSV masks. The Individual Typology Angle ($ITA^\circ$) classifies the skin shade and determines warm, cool, neutral, or olive undertones.
3. **Gemma 4 Multimodal Reasoning**: The combined outfit attributes and facial profile are submitted to Gemma 4 with a strict JSON schema prompt to construct 3 synchronized beauty looks with specific product matches and step-by-step instructions.
4. **Live AR Mirror Guidance**: Selecting a look opens the live AR camera viewport. The user's webcam stream is mirrored at 60 FPS while MediaPipe Face Mesh detects 468 landmark coordinates to dynamically project pulsing cheekbone apex guides, eyelid crease fills, precision winged eyeliner vectors, and lip vermilion overlays.
5. **Look Preservation**: Users can save any curated look to their personal vault or review past sessions in the atelier history timeline.

---

### Technical Decisions

- **Direct HTML5 Webcam Capture with Dual Fallback**: Rather than relying exclusively on third-party camera wrappers, the frontend utilizes direct `navigator.mediaDevices.getUserMedia` with fallback constraints to ensure instant 60 FPS video feedback without black screens.
- **YuNet ONNX Face Detection**: We selected OpenCV's lightweight YuNet ONNX model (~300KB) for server-side face detection due to its sub-10ms inference time and accurate 5-point landmark localization.
- **CIELAB ITA Colorimetry**: We implemented the dermatological standard Individual Typology Angle ($ITA$) in CIELAB color space to provide unbiased, objective skin tone categorization.
- **Zero OpenAI Dependency**: The architecture strictly uses Gemma 4 / Google AI Studio models combined with local computer vision algorithms.

---

## Setup & Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Create environment configuration:
cp .env.example .env
# Edit .env and add your GEMMA_API_KEY (optional - deterministic fallback included)

# Start FastAPI server:
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser to launch **GlamSync AI**.

### 3. Running Test Suite
```bash
cd backend
.\venv\Scripts\python.exe -m pytest
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

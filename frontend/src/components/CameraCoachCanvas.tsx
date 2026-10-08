import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { LookOption, TutorialStep } from '../types';
import { recordHistoryEntry } from '../services/api';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Layers,
  Trophy,
  AlertCircle,
  Droplets,
  ShieldCheck,
  Brush,
  Palette,
  Eye,
  Smile,
  Star,
  Sun,
  Heart,
  Flower2,
  Crown,
  Music,
  Coffee,
  Briefcase,
  Moon,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CameraCoachProps {
  look: LookOption;
  onExit: () => void;
}

// ─── Makeup layer ordering ────────────────────────────────────────────────────
const MAKEUP_LAYERS = [
  {
    id: 'cleanse',
    label: 'Cleanse & Prep',
    icon: '🧼',
    color: '#e0f2fe',
    textColor: '#0369a1',
    borderColor: '#bae6fd',
    description: 'Start with a clean, fresh canvas.',
    tip: 'Use a gentle micellar water or foaming cleanser to remove all traces of dirt, oil and previous makeup.',
    region: 'full_face' as const,
  },
  {
    id: 'toner',
    label: 'Toner',
    icon: '💧',
    color: '#f0fdf4',
    textColor: '#166534',
    borderColor: '#bbf7d0',
    description: 'Balance skin pH and refine pores.',
    tip: 'Pat toner gently with a cotton pad or your fingertips—never rub. Focus on T-zone and any dry patches.',
    region: 'full_face' as const,
  },
  {
    id: 'serum',
    label: 'Serum',
    icon: '✨',
    color: '#fefce8',
    textColor: '#854d0e',
    borderColor: '#fde68a',
    description: 'Targeted active ingredients for your skin concerns.',
    tip: 'Apply 2–3 drops and press (don\'t rub) into skin while it\'s still slightly damp from toner for maximum absorption.',
    region: 'full_face' as const,
  },
  {
    id: 'moisturizer',
    label: 'Moisturizer',
    icon: '🌊',
    color: '#f0f9ff',
    textColor: '#075985',
    borderColor: '#bae6fd',
    description: 'Lock in hydration and create a smooth base.',
    tip: 'Use upward strokes and don\'t forget your neck. Wait 2 minutes before applying primer so it absorbs fully.',
    region: 'cheekbone' as const,
  },
  {
    id: 'eyecream',
    label: 'Eye Cream',
    icon: '👁️',
    color: '#faf5ff',
    textColor: '#7e22ce',
    borderColor: '#e9d5ff',
    description: 'Depuff and brighten the under-eye area.',
    tip: 'Use your ring finger (lightest pressure) to tap eye cream along the orbital bone—never pull or drag.',
    region: 'eyelid' as const,
  },
  {
    id: 'sunscreen',
    label: 'SPF / Sunscreen',
    icon: '☀️',
    color: '#fff7ed',
    textColor: '#c2410c',
    borderColor: '#fed7aa',
    description: 'Protect and preserve—the most important skincare step.',
    tip: 'Apply SPF 30+ as the last skincare step. Wait 5–10 minutes before primer for chemical SPF to activate.',
    region: 'full_face' as const,
  },
  {
    id: 'primer',
    label: 'Primer',
    icon: '🎨',
    color: '#fdf4ff',
    textColor: '#86198f',
    borderColor: '#f0abfc',
    description: 'Smooth pores and extend makeup wear.',
    tip: 'Apply a pea-sized amount and blend outward in gentle circular motions. Focus on larger pores and fine lines.',
    region: 'full_face' as const,
  },
  {
    id: 'colorcorrect',
    label: 'Color Corrector',
    icon: '🟠',
    color: '#fff1f2',
    textColor: '#9f1239',
    borderColor: '#fecdd3',
    description: 'Neutralize discoloration before foundation.',
    tip: 'Use peach/orange for dark circles (medium-deep skin), green for redness. Apply sparingly—a little goes a long way.',
    region: 'eyelid' as const,
  },
  {
    id: 'foundation',
    label: 'Foundation',
    icon: '🌸',
    color: '#fdf2f8',
    textColor: '#9d174d',
    borderColor: '#fbcfe8',
    description: 'Even out your skin tone for a flawless base.',
    tip: 'Start from center of face and blend outward. Use a damp beauty sponge for seamless, skin-like finish.',
    region: 'cheekbone' as const,
  },
  {
    id: 'concealer',
    label: 'Concealer',
    icon: '🔆',
    color: '#fffbeb',
    textColor: '#92400e',
    borderColor: '#fde68a',
    description: 'Spot-cover imperfections and brighten under-eyes.',
    tip: 'Apply concealer in a triangle shape under eyes for max brightening. Bake with loose powder for 5 minutes for longevity.',
    region: 'eyelid' as const,
  },
  {
    id: 'contour',
    label: 'Contour & Bronzer',
    icon: '🌓',
    color: '#fef3c7',
    textColor: '#78350f',
    borderColor: '#fcd34d',
    description: 'Sculpt and define facial structure.',
    tip: 'Apply bronzer where the sun naturally hits: temples, cheekbones, bridge of nose, jawline. Blend thoroughly to avoid harsh lines.',
    region: 'cheekbone' as const,
  },
  {
    id: 'blush',
    label: 'Blush',
    icon: '🌺',
    color: '#fff1f2',
    textColor: '#be123c',
    borderColor: '#fecdd3',
    description: 'Add warmth and a natural flush to cheeks.',
    tip: 'Smile gently and apply blush to the apples of cheeks, sweeping upward toward temples for a lifted effect.',
    region: 'cheekbone' as const,
  },
  {
    id: 'highlight',
    label: 'Highlight',
    icon: '⚡',
    color: '#fefce8',
    textColor: '#a16207',
    borderColor: '#fef08a',
    description: 'Catch the light and add luminosity.',
    tip: 'Apply to: bridge of nose, cupid\'s bow, inner corners of eyes, brow bone, and top of cheekbones. Less is more!',
    region: 'cheekbone' as const,
  },
  {
    id: 'eyeshadow',
    label: 'Eye Shadow',
    icon: '💜',
    color: '#f5f3ff',
    textColor: '#5b21b6',
    borderColor: '#ddd6fe',
    description: 'Define and enhance the eyes with depth and dimension.',
    tip: 'Start with a transition shade in the crease, then build intensity with darker shades. Blend, blend, blend!',
    region: 'eyelid' as const,
  },
  {
    id: 'eyeliner',
    label: 'Eyeliner',
    icon: '✏️',
    color: '#1e1b4b',
    textColor: '#818cf8',
    borderColor: '#4338ca',
    description: 'Define the lash line for precision and drama.',
    tip: 'Rest your elbow on a flat surface for stability. Work in small strokes rather than one long line for better control.',
    region: 'eyeliner' as const,
  },
  {
    id: 'mascara',
    label: 'Mascara',
    icon: '🖤',
    color: '#0f172a',
    textColor: '#94a3b8',
    borderColor: '#334155',
    description: 'Open up and lengthen lashes dramatically.',
    tip: 'Wiggle the wand at the base of lashes and sweep upward. Apply 2-3 coats, allowing each to dry slightly between applications.',
    region: 'eyelid' as const,
  },
  {
    id: 'lipliner',
    label: 'Lip Liner',
    icon: '💋',
    color: '#fff1f2',
    textColor: '#9f1239',
    borderColor: '#fecdd3',
    description: 'Define and shape the lip contour.',
    tip: 'Over-line slightly at cupid\'s bow and just outside your natural lip line for a fuller look. Fill in lips for all-day color.',
    region: 'lips' as const,
  },
  {
    id: 'lipcolor',
    label: 'Lip Color',
    icon: '🌹',
    color: '#fff1f2',
    textColor: '#be123c',
    borderColor: '#fda4af',
    description: 'The finishing touch — your signature color.',
    tip: 'Blot once with tissue and reapply for lasting wear. Press a single-ply tissue over lips and dust translucent powder through it to set.',
    region: 'lips' as const,
  },
  {
    id: 'setting',
    label: 'Setting Spray',
    icon: '🌟',
    color: '#ecfdf5',
    textColor: '#065f46',
    borderColor: '#6ee7b7',
    description: 'Lock everything in place for all-day wear.',
    tip: 'Hold 8–10 inches away and spritz in an X then T motion. Close eyes! Let it air-dry—never fan or rub.',
    region: 'full_face' as const,
  },
];

// ─── Occasion presets ─────────────────────────────────────────────────────────
const OCCASION_STYLES = [
  {
    category: '☀️ Everyday',
    options: [
      { id: 'no_makeup', label: 'No-Makeup Makeup', icon: Coffee, description: 'Dewy skin, clear brows, tinted balm', layers: ['cleanse', 'toner', 'moisturizer', 'sunscreen', 'concealer', 'mascara', 'lipcolor'] },
      { id: 'casual', label: 'Casual Day Out', icon: Coffee, description: 'Fresh & effortless for errands, coffee', layers: ['cleanse', 'toner', 'moisturizer', 'sunscreen', 'primer', 'foundation', 'concealer', 'blush', 'mascara', 'lipcolor'] },
      { id: 'office', label: 'Office / Corporate', icon: Briefcase, description: 'Polished, professional, long-lasting', layers: ['cleanse', 'toner', 'moisturizer', 'sunscreen', 'primer', 'foundation', 'concealer', 'contour', 'blush', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'campus', label: 'Campus & College', icon: Star, description: 'Fresh youth-forward look', layers: ['cleanse', 'moisturizer', 'sunscreen', 'concealer', 'blush', 'eyeshadow', 'mascara', 'lipcolor'] },
    ]
  },
  {
    category: '🌙 Evening & Social',
    options: [
      { id: 'date_night', label: 'Date Night', icon: Heart, description: 'Sultry, romantic & luminous', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'eyecream', 'primer', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'cocktail', label: 'Cocktail Party', icon: Zap, description: 'Glamorous with editorial flair', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'primer', 'colorcorrect', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'nightclub', label: 'Night Club / Rave', icon: Music, description: 'Bold, dramatic, photo-ready', layers: ['primer', 'colorcorrect', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'beach', label: 'Beach / Vacation', icon: Sun, description: 'Waterproof, dewy glow', layers: ['cleanse', 'moisturizer', 'sunscreen', 'concealer', 'blush', 'highlight', 'mascara', 'lipcolor'] },
    ]
  },
  {
    category: '💍 Formal & Festive',
    options: [
      { id: 'wedding_guest', label: 'Wedding Guest', icon: Flower2, description: 'Sophisticated & camera-ready', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'eyecream', 'sunscreen', 'primer', 'colorcorrect', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'sangeet', label: 'Sangeet & Mehndi', icon: Music, description: 'Festive, vibrant, traditional', layers: ['cleanse', 'toner', 'moisturizer', 'primer', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'diwali', label: 'Diwali / Eid Gala', icon: Star, description: 'Jewel-toned, luminous, festive', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'primer', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
      { id: 'bridal', label: 'Grand Bridal Look', icon: Crown, description: 'Full luxury glam — all 19 steps', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'eyecream', 'sunscreen', 'primer', 'colorcorrect', 'foundation', 'concealer', 'contour', 'blush', 'highlight', 'eyeshadow', 'eyeliner', 'mascara', 'lipliner', 'lipcolor', 'setting'] },
    ]
  },
  {
    category: '🌿 Skincare Only',
    options: [
      { id: 'am_routine', label: 'Morning Routine', icon: Sun, description: 'Hydrate, protect, glow', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'eyecream', 'sunscreen'] },
      { id: 'pm_routine', label: 'Evening Routine', icon: Moon, description: 'Repair, nourish, restore', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'eyecream'] },
      { id: 'skincare_full', label: 'Full Skincare Ritual', icon: Droplets, description: 'All skincare layers, all steps', layers: ['cleanse', 'toner', 'serum', 'moisturizer', 'eyecream', 'sunscreen'] },
    ]
  }
];

export const CameraCoachCanvas: React.FC<CameraCoachProps> = ({ look, onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showMeshOutline, setShowMeshOutline] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Makeup layer & occasion panel state
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([
    'cleanse', 'toner', 'moisturizer', 'primer', 'foundation',
    'concealer', 'blush', 'eyeshadow', 'eyeliner', 'mascara', 'lipcolor', 'setting'
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('cleanse');
  const [activeOccasionId, setActiveOccasionId] = useState<string | null>(null);
  const [showOccasionPanel, setShowOccasionPanel] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastLandmarksRef = useRef<any[] | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const currentStep: TutorialStep = look.tutorial_steps[currentStepIndex] || look.tutorial_steps[0];
  const activeRegion = currentStep.face_region || 'cheekbone';

  // Active layer from panel
  const activeLayer = MAKEUP_LAYERS.find(l => l.id === activeLayerId) || MAKEUP_LAYERS[0];
  const selectedLayers = MAKEUP_LAYERS.filter(l => selectedLayerIds.includes(l.id));

  // Speak step instruction when changing steps
  useEffect(() => {
    if (speechEnabled && 'speechSynthesis' in window && currentStep) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Step ${currentStep.step}: ${currentStep.title}. ${currentStep.instruction}`);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStepIndex, speechEnabled, currentStep]);

  // Main camera start routine
  const startWebcamAndAR = useCallback(async () => {
    setCameraLoading(true);
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 }, facingMode: 'user' },
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(() => resolve()).catch(() => resolve());
        };
      });

      setCameraActive(true);
      setCameraLoading(false);

      try {
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMesh.onResults((results: Results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            lastLandmarksRef.current = results.multiFaceLandmarks[0];
            setFaceDetected(true);
          } else {
            lastLandmarksRef.current = null;
            setFaceDetected(false);
          }
          isProcessingRef.current = false;
        });
        faceMeshRef.current = faceMesh;
      } catch (fmErr) {
        console.warn('MediaPipe FaceMesh CDN background init warning:', fmErr);
      }

      const renderLoop = async () => {
        const canvas = canvasRef.current;
        const vid = videoRef.current;
        if (canvas && vid && vid.readyState >= 2) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            const landmarks = lastLandmarksRef.current;
            if (landmarks && landmarks.length > 0) {
              drawArOverlays(ctx, canvas, landmarks, activeRegion, showMeshOutline);
            } else {
              drawAlignmentGuide(ctx, canvas, activeRegion);
            }
          }
          if (faceMeshRef.current && !isProcessingRef.current && vid.readyState >= 3) {
            isProcessingRef.current = true;
            faceMeshRef.current.send({ image: vid }).catch(() => { isProcessingRef.current = false; });
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      };
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser\'s address bar to use the live AR Mirror.'
          : 'Webcam not detected or busy in another application. Please check your camera connection.'
      );
      setCameraLoading(false);
      setCameraActive(false);
    }
  }, [activeRegion, showMeshOutline]);

  useEffect(() => {
    startWebcamAndAR();
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      if (faceMeshRef.current) { try { faceMeshRef.current.close(); } catch {} }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [startWebcamAndAR]);

  const drawArOverlays = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, landmarks: any[], region: string, showMesh: boolean) => {
    const getX = (pt: any) => (1 - pt.x) * canvas.width;
    const getY = (pt: any) => pt.y * canvas.height;

    if (showMesh) {
      ctx.fillStyle = 'rgba(112, 26, 53, 0.25)';
      for (let i = 0; i < landmarks.length; i += 4) {
        const pt = landmarks[i];
        ctx.beginPath();
        ctx.arc(getX(pt), getY(pt), 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    if (region === 'cheekbone') {
      const leftCheek = landmarks[116];
      const rightCheek = landmarks[345];
      if (leftCheek && rightCheek) {
        const pulse = 30 + Math.sin(Date.now() / 200) * 4;
        [{ pt: leftCheek, dir: -1 }, { pt: rightCheek, dir: 1 }].forEach(({ pt, dir }) => {
          const x = getX(pt), y = getY(pt);
          const g = ctx.createRadialGradient(x, y, 4, x, y, pulse);
          g.addColorStop(0, 'rgba(190, 18, 60, 0.55)');
          g.addColorStop(1, 'rgba(190, 18, 60, 0.0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#be123c';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(190,18,60,0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + dir * 28, y - 20);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }
    } else if (region === 'lips') {
      const lipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
      ctx.fillStyle = 'rgba(159, 18, 57, 0.35)';
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      lipOuter.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (!pt) return;
        if (i === 0) ctx.moveTo(getX(pt), getY(pt));
        else ctx.lineTo(getX(pt), getY(pt));
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (region === 'eyelid' || region === 'eyeliner') {
      const leftEye = [246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
      const rightEye = [466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263];
      ctx.fillStyle = 'rgba(112, 26, 53, 0.3)';
      ctx.strokeStyle = '#701a35';
      ctx.lineWidth = 1.5;
      [leftEye, rightEye].forEach((pts) => {
        ctx.beginPath();
        pts.forEach((idx, i) => {
          const pt = landmarks[idx];
          if (!pt) return;
          if (i === 0) ctx.moveTo(getX(pt), getY(pt));
          else ctx.lineTo(getX(pt), getY(pt));
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }
  };

  const drawAlignmentGuide = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, region: string) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.strokeStyle = 'rgba(112, 26, 53, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, canvas.width * 0.26, canvas.height * 0.36, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    if (region === 'cheekbone') {
      ctx.fillStyle = 'rgba(112, 26, 53, 0.12)';
      ctx.beginPath();
      ctx.arc(cx - 70, cy + 10, 24, 0, 2 * Math.PI);
      ctx.arc(cx + 70, cy + 10, 24, 0, 2 * Math.PI);
      ctx.fill();
    } else if (region === 'lips') {
      ctx.fillStyle = 'rgba(159, 18, 57, 0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 70, 36, 16, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < look.tutorial_steps.length - 1) {
      if (!completedSteps.includes(currentStep.step)) setCompletedSteps(prev => [...prev, currentStep.step]);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      if (!completedSteps.includes(currentStep.step)) setCompletedSteps(prev => [...prev, currentStep.step]);
      setIsFinished(true);
      recordHistoryEntry({
        type: 'coach_session',
        title: `AR Coaching Session: ${look.name}`,
        summary: `Completed all ${look.tutorial_steps.length} interactive AR tutorial steps for ${look.name}.`,
        details: { look_id: look.id, look_name: look.name, completed_steps: look.tutorial_steps.length, intensity: look.intensity }
      });
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  const toggleStepCompleted = (stepNum: number) => {
    setCompletedSteps(prev => prev.includes(stepNum) ? prev.filter(s => s !== stepNum) : [...prev, stepNum]);
  };

  const handleApplyOccasion = (occ: typeof OCCASION_STYLES[0]['options'][0]) => {
    setActiveOccasionId(occ.id);
    setSelectedLayerIds(occ.layers);
    setActiveLayerId(occ.layers[0]);
    setShowOccasionPanel(false);
    setShowLayerPanel(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* Hidden Source Video Element */}
      <video ref={videoRef} playsInline muted autoPlay className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none" />

      {/* ── Top Header Bar (matches main editorial UI) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-[#f0e4e2] shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#701a35] bg-[#fcedec] border border-[#f3d7d4] px-2.5 py-0.5 rounded-full">
              Live AR Mirror
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              {faceDetected ? 'Face Tracked' : 'Align Face'}
            </span>
            {activeOccasionId && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#701a35] bg-[#fdf4f2] border border-[#f3d7d4] px-2.5 py-0.5 rounded-full">
                {OCCASION_STYLES.flatMap(c => c.options).find(o => o.id === activeOccasionId)?.label}
              </span>
            )}
          </div>
          <h2 className="font-display font-extrabold text-xl text-[#1a1618] mt-1">{look.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tutorial Step <span className="text-[#701a35] font-semibold">{currentStep.step}</span> of {look.tutorial_steps.length}:&nbsp;
            <span className="text-[#1a1618] font-semibold">{currentStep.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowOccasionPanel(p => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${showOccasionPanel ? 'bg-[#701a35] text-white border-[#701a35]' : 'bg-white text-[#701a35] border-[#f3d7d4] hover:bg-[#fcedec]'}`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Occasion Style</span>
          </button>

          <button
            onClick={() => setShowLayerPanel(p => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${showLayerPanel ? 'bg-[#701a35] text-white border-[#701a35]' : 'bg-white text-gray-700 border-[#eee0dd] hover:bg-gray-50'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Makeup Layers</span>
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${speechEnabled ? 'bg-[#fcedec] border-[#f3d7d4] text-[#701a35]' : 'bg-white border-[#eee0dd] text-gray-400 hover:text-gray-700'}`}
            title={speechEnabled ? 'Voice Active' : 'Voice Muted'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowMeshOutline(!showMeshOutline)}
            className={`p-2.5 rounded-xl border transition-colors ${showMeshOutline ? 'bg-[#fcedec] border-[#f3d7d4] text-[#701a35]' : 'bg-white border-[#eee0dd] text-gray-400 hover:text-gray-700'}`}
            title="Face Mesh Points"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-[#eee0dd] text-xs font-semibold text-gray-700 transition-all"
          >
            ← Exit Mirror
          </button>
        </div>
      </div>

      {/* ── Occasion Style Panel ── */}
      {showOccasionPanel && (
        <div className="bg-white rounded-2xl border border-[#f0e4e2] shadow-sm p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-[#1a1618]">Choose Your Occasion</h3>
              <p className="text-xs text-gray-500 mt-0.5">Auto-loads the perfect skincare + makeup layer sequence for your event</p>
            </div>
            <button onClick={() => setShowOccasionPanel(false)} className="text-xs text-gray-400 hover:text-gray-700">✕ Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {OCCASION_STYLES.map((cat) => (
              <div key={cat.category} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{cat.category}</p>
                <div className="space-y-1.5">
                  {cat.options.map((occ) => {
                    const Icon = occ.icon;
                    const isActive = activeOccasionId === occ.id;
                    return (
                      <button
                        key={occ.id}
                        onClick={() => handleApplyOccasion(occ)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${isActive ? 'bg-[#fcedec] border-[#701a35] text-[#701a35]' : 'bg-[#fdfaf9] border-[#f5eae8] hover:border-[#f3d7d4] hover:bg-[#fdf5f3]'}`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isActive ? 'text-[#701a35]' : 'text-gray-500'}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#701a35]' : 'text-[#1a1618]'}`}>{occ.label}</p>
                          <p className="text-[10px] text-gray-500 truncate">{occ.description}</p>
                          <p className="text-[10px] text-[#701a35] font-medium mt-0.5">{occ.layers.length} steps</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Makeup Layer Progress Bar ── */}
      {showLayerPanel && (
        <div className="bg-white rounded-2xl border border-[#f0e4e2] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#701a35]">Makeup & Skincare Layers</span>
              <span className="text-[10px] text-gray-400 font-mono">{selectedLayers.length} steps selected</span>
            </div>
            <p className="text-[10px] text-gray-500">Click any layer to activate it in the AR mirror</p>
          </div>

          {/* Layer pills — horizontally scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {MAKEUP_LAYERS.map((layer, idx) => {
              const isSelected = selectedLayerIds.includes(layer.id);
              const isActive = activeLayerId === layer.id;
              const orderInSelected = selectedLayers.findIndex(l => l.id === layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    if (!isSelected) {
                      setSelectedLayerIds(prev => [...prev, layer.id]);
                    }
                    setActiveLayerId(layer.id);
                  }}
                  title={layer.label}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all text-center min-w-[72px] ${
                    isActive
                      ? 'bg-[#701a35] border-[#701a35] text-white shadow-md scale-105'
                      : isSelected
                      ? 'bg-[#fcedec] border-[#f3d7d4] text-[#701a35]'
                      : 'bg-[#fafafa] border-[#eee0dd] text-gray-400 opacity-50'
                  }`}
                >
                  <span className="text-base leading-none">{layer.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight whitespace-nowrap">{layer.label}</span>
                  {isSelected && orderInSelected >= 0 && (
                    <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none ${isActive ? 'bg-white/20 text-white' : 'bg-[#f3d7d4] text-[#701a35]'}`}>
                      {orderInSelected + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Layer Detail Card */}
          {activeLayerId && (
            <div
              className="flex items-start gap-3 p-3 rounded-xl border"
              style={{ backgroundColor: activeLayer.color, borderColor: activeLayer.borderColor }}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{activeLayer.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold" style={{ color: activeLayer.textColor }}>{activeLayer.label}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: activeLayer.borderColor, color: activeLayer.textColor }}>
                    {activeLayer.region === 'full_face' ? 'Full Face' : activeLayer.region === 'cheekbone' ? 'Cheeks' : activeLayer.region === 'eyelid' || activeLayer.region === 'eyeliner' ? 'Eyes' : 'Lips'}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 text-gray-700">{activeLayer.description}</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: activeLayer.textColor }}>
                  💡 {activeLayer.tip}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main AR Canvas & Guidance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left 8 cols: Camera Viewport */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-2 border-[#f3d7d4] bg-[#fdfaf9] flex items-center justify-center">

            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover" />

            {/* Loading */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center space-y-3 z-20">
                <RefreshCw className="w-8 h-8 text-[#701a35] animate-spin" />
                <p className="text-sm font-semibold text-[#1a1618]">Accessing Camera Feed...</p>
                <p className="text-xs text-gray-500">Initializing real-time video stream & MediaPipe mesh</p>
              </div>
            )}

            {/* Error */}
            {cameraError && (
              <div className="absolute inset-0 bg-white/97 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <AlertCircle className="w-10 h-10 text-[#701a35]" />
                <p className="text-sm font-semibold text-[#701a35] max-w-sm">{cameraError}</p>
                <button
                  onClick={startWebcamAndAR}
                  className="px-5 py-2 rounded-xl bg-[#701a35] hover:bg-[#581429] text-xs font-bold text-white shadow-sm transition-all"
                >
                  Retry Camera Connection
                </button>
              </div>
            )}

            {/* Top HUD */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#f3d7d4] shadow-sm">
              <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
              <span className="text-xs font-bold text-[#701a35] uppercase tracking-wider">
                {activeLayer.icon} {activeLayer.label}
              </span>
              <span className="text-[10px] text-gray-500">
                {faceDetected ? '• 468-pt Mesh Active' : '• Center your face'}
              </span>
            </div>

            {/* Bottom instruction strip */}
            <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/90 backdrop-blur-md text-[#1a1618] p-3.5 rounded-xl border border-[#f3d7d4] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-[#701a35] uppercase tracking-wider">
                  AR Directive • {currentStep.technique}
                </span>
                {currentStep.estimated_time_sec && (
                  <span className="text-[11px] text-gray-500">⏱ ~{currentStep.estimated_time_sec}s</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-800">{currentStep.instruction}</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="w-full flex items-center justify-between mt-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-gray-700 border border-[#eee0dd] shadow-sm transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <span className="text-xs text-gray-500 font-medium">
              Step {currentStepIndex + 1} of {look.tutorial_steps.length}
            </span>

            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#701a35] hover:bg-[#581429] text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            >
              <span>{currentStepIndex === look.tutorial_steps.length - 1 ? 'Finish Routine 🎉' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 4 cols: Checklist & Tips */}
        <div className="lg:col-span-4 space-y-4">

          {/* Tutorial Sequence Checklist */}
          <div className="p-5 rounded-2xl bg-white border border-[#f0e4e2] shadow-sm space-y-4">
            <h4 className="font-display font-bold text-sm text-[#1a1618] flex items-center justify-between">
              <span>Tutorial Sequence</span>
              <span className="text-xs text-[#701a35] font-mono">
                {completedSteps.length}/{look.tutorial_steps.length} Done
              </span>
            </h4>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {look.tutorial_steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isDone = completedSteps.includes(step.step);
                return (
                  <div
                    key={step.step}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isActive
                        ? 'bg-[#fcedec] border-[#701a35] text-[#1a1618] shadow-sm'
                        : isDone
                        ? 'bg-emerald-50 border-emerald-200 text-gray-600'
                        : 'bg-[#fdfaf9] border-[#f5eae8] text-gray-500 hover:text-[#1a1618] hover:border-[#f3d7d4]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleStepCompleted(step.step); }}
                      className="mt-0.5 focus:outline-none"
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-500' : isActive ? 'text-[#701a35]' : 'text-gray-300'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{step.title}</p>
                      <p className="text-[11px] text-gray-400 capitalize mt-0.5">{step.face_region} • {step.technique}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Tip Card */}
          {currentStep.pro_tip && (
            <div className="p-4 rounded-xl bg-[#fcf5f4] border border-[#f3dedb] space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#701a35] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Pro Makeup Tip
              </span>
              <p className="text-xs text-gray-700 leading-relaxed">{currentStep.pro_tip}</p>
            </div>
          )}

          {/* Active Layer Skincare Tip */}
          <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: activeLayer.color, borderColor: activeLayer.borderColor }}>
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: activeLayer.textColor }}>
              <span className="text-base">{activeLayer.icon}</span> {activeLayer.label} Tip
            </span>
            <p className="text-xs leading-relaxed text-gray-700">{activeLayer.tip}</p>
          </div>

          {/* Routine Complete Card */}
          {isFinished && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#fcedec] via-white to-[#fff7ed] border border-[#f3d7d4] text-center space-y-3 animate-fadeIn">
              <Trophy className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
              <h4 className="font-display font-extrabold text-base text-[#1a1618]">Routine Complete!</h4>
              <p className="text-xs text-gray-600">
                You've mastered all steps for <strong className="text-[#701a35]">{look.name}</strong>. Your look is perfectly calibrated for your occasion.
              </p>
              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-[#701a35] hover:bg-[#581429] text-xs font-bold text-white shadow-sm transition-all"
              >
                Back to Look Studio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanFace, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Layers, 
  Eye, 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Palette, 
  Sliders, 
  Check, 
  Copy, 
  SunMedium, 
  Target,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { FaceAnalysisResult, FaceProfile } from '../types';
import { analyzeFace } from '../services/api';

interface FaceAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProfile: (profile: FaceProfile, analysis: FaceAnalysisResult) => void;
  currentProfile?: FaceProfile | null;
}

const PRESET_FACES = [
  {
    name: 'Warm Golden Oval',
    desc: 'Golden honey undertone with balanced classic proportions',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    fallback: {
      face_detected: true,
      face_shape: 'Oval',
      face_shape_confidence: 0.95,
      face_shape_guide: 'Harmoniously balanced classic proportions. Ideal canvas for high cheekbone sculpting and precision winged eyeliner.',
      skin_tone: 'Medium / Beige',
      skin_undertone: 'Warm (Golden / Peachy)',
      skin_hex: '#e2ab86',
      ita_score: 34.5,
      luminance_score: 68.0,
      lighting_quality: 'Optimal Studio Lighting',
      sharpness_score: 94.0,
      symmetry_score: 96.0,
      facial_regions: { face_box: { x: 80, y: 60, width: 240, height: 320 }, landmarks_count: 5, eye_distance_px: 88.0, mouth_width_px: 64.0 },
      flattering_colors: ['#d97706', '#c2410c', '#b45309', '#92400e', '#b91c1c', '#fde68a'],
      makeup_tips: [
        'Warm Golden Undertone: Opt for terracotta, peach, copper bronze, and warm ruby red shades.',
        'Contour along natural cheek hollows with an angled brush for effortless lift.'
      ]
    } as FaceAnalysisResult
  },
  {
    name: 'Cool Berry Round',
    desc: 'Rosy berry undertone with soft feminine contours',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    fallback: {
      face_detected: true,
      face_shape: 'Round',
      face_shape_confidence: 0.91,
      face_shape_guide: 'Balanced width and height with soft curves. Apply contour diagonally beneath cheekbones towards temples to add sculpted definition.',
      skin_tone: 'Fair / Light',
      skin_undertone: 'Cool (Rosy / Berry)',
      skin_hex: '#f5c3b2',
      ita_score: 44.8,
      luminance_score: 74.0,
      lighting_quality: 'Optimal Studio Lighting',
      sharpness_score: 91.0,
      symmetry_score: 93.0,
      facial_regions: { face_box: { x: 70, y: 70, width: 250, height: 260 }, landmarks_count: 5, eye_distance_px: 84.0, mouth_width_px: 58.0 },
      flattering_colors: ['#be123c', '#9d174d', '#831843', '#6b21a8', '#cbd5e1', '#f43f5e'],
      makeup_tips: [
        'Cool Rosy Undertone: Flatter with berry, mauve, cool fuchsia, champagne silver, and plum hues.',
        'Face Shape (Round): Focus contour along temples and under cheekbones with an angled brush to lengthen.'
      ]
    } as FaceAnalysisResult
  },
  {
    name: 'Olive Diamond Glam',
    desc: 'Olive undertone with striking high cheekbones',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    fallback: {
      face_detected: true,
      face_shape: 'Diamond',
      face_shape_confidence: 0.88,
      face_shape_guide: 'High dramatic cheekbones with narrower forehead and jaw. Highlight temples and jawline while softening cheek apex with luminous blush.',
      skin_tone: 'Tan / Golden Medium',
      skin_undertone: 'Olive (Subtle Warm-Neutral)',
      skin_hex: '#c9966b',
      ita_score: 24.2,
      luminance_score: 60.0,
      lighting_quality: 'Optimal Studio Lighting',
      sharpness_score: 93.5,
      symmetry_score: 95.0,
      facial_regions: { face_box: { x: 75, y: 65, width: 235, height: 300 }, landmarks_count: 5, eye_distance_px: 80.0, mouth_width_px: 60.0 },
      flattering_colors: ['#854d0e', '#a16207', '#701a75', '#881337', '#ca8a04', '#4d7c0f'],
      makeup_tips: [
        'Olive Undertone: Enhance with rich bronze, burnt sienna, fig berry, and muted earthy undertones.',
        'Face Shape (Diamond): Soften high cheek peaks and highlight forehead/chin to create balanced harmony.'
      ]
    } as FaceAnalysisResult
  }
];

export const FaceAnalyzerModal: React.FC<FaceAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onApplyProfile,
  currentProfile
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'preset'>('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showHudOverlay, setShowHudOverlay] = useState(true);
  const [copiedHex, setCopiedHex] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);

    stopCamera();

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: 'user'
          },
          audio: false
        });
      } catch (e) {
        console.warn("Retrying with standard camera constraints:", e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
      }
      setCameraActive(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? "Camera permission was denied. Please allow camera access in your browser."
          : "Webcam not detected or unavailable. Try uploading a photo or using instant presets."
      );
      setCameraActive(false);
      setCameraLoading(false);
    }
  };

  // Trigger camera on open / tab change
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !imagePreview) {
      // Small timeout to allow DOM node to mount
      const timer = setTimeout(() => {
        startCamera();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab, imagePreview]);

  const handleCaptureCamera = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setImagePreview(dataUrl);
    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setIsAnalyzing(true);
      try {
        const result = await analyzeFace(blob);
        setAnalysisResult(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    stopCamera();
    setIsAnalyzing(true);
    try {
      const result = await analyzeFace(file);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_FACES[0]) => {
    setImagePreview(preset.image);
    stopCamera();
    setAnalysisResult(preset.fallback);
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const handleApply = () => {
    if (!analysisResult) return;
    const profile: FaceProfile = {
      face_shape: analysisResult.face_shape,
      skin_tone: analysisResult.skin_tone,
      skin_undertone: analysisResult.skin_undertone,
      skin_hex: analysisResult.skin_hex,
      lighting_quality: analysisResult.lighting_quality,
      sharpness_score: analysisResult.sharpness_score,
      symmetry_score: analysisResult.symmetry_score
    };
    onApplyProfile(profile, analysisResult);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#120b1f] border border-pink-500/30 rounded-2xl shadow-2xl shadow-pink-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-500/20 bg-[#170e28]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-amber-400 p-[2px] flex items-center justify-center shadow-md shadow-pink-500/20">
              <div className="w-full h-full bg-[#120b1f] rounded-[10px] flex items-center justify-center">
                <ScanFace className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">
                  OpenCV <span className="gradient-text">Face & Skin Analyzer</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  YuNet DNN + CIELAB
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Precision face morphology, ITA skin tone, undertone detection, and golden-ratio contour guidance.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#140c24] border-b border-white/5">
          <button
            onClick={() => {
              setImagePreview(null);
              setAnalysisResult(null);
              setActiveTab('camera');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera Snapshot</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo / Selfie</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab('preset');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'preset'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant Demo Presets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Camera / Visualizer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-pink-500/30 aspect-[4/3] flex items-center justify-center shadow-inner group">
                
                {/* 1. Live Camera Mode */}
                {activeTab === 'camera' && !imagePreview && (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Camera Loading Overlay */}
                    {cameraLoading && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-2 z-10">
                        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                        <p className="text-xs font-semibold text-white">Starting Webcam Feed...</p>
                      </div>
                    )}

                    {/* Camera Error Overlay */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                        <AlertCircle className="w-8 h-8 text-rose-400" />
                        <p className="text-xs text-rose-200 max-w-xs">{cameraError}</p>
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
                        >
                          Retry Camera
                        </button>
                      </div>
                    )}

                    {/* Overlay Face Target Guide */}
                    {cameraActive && (
                      <>
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-52 h-72 border-2 border-dashed border-pink-400/60 rounded-[45px] animate-pulse flex items-center justify-center">
                            <span className="text-[11px] text-pink-300 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-pink-500/30">
                              Align Face in Frame
                            </span>
                          </div>
                        </div>

                        {/* Capture Button */}
                        <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                          <button
                            onClick={handleCaptureCamera}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:scale-105 active:scale-95 text-white font-semibold text-sm shadow-xl shadow-pink-600/40 transition-all cursor-pointer"
                          >
                            <Camera className="w-5 h-5" />
                            <span>Capture & Analyze Face</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 2. Upload Mode */}
                {activeTab === 'upload' && !imagePreview && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer border-2 border-dashed border-pink-500/30 hover:border-pink-500/60 rounded-2xl transition-all group hover:bg-pink-950/10"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold text-sm text-white mb-1">Upload Face Photo or Selfie</h4>
                    <p className="text-xs text-gray-400 max-w-xs">
                      Supports JPG, PNG, WebP. Natural lighting facing the camera gives optimal analysis.
                    </p>
                  </div>
                )}

                {/* 3. Preset Mode */}
                {activeTab === 'preset' && !imagePreview && (
                  <div className="w-full h-full p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-y-auto">
                    {PRESET_FACES.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPreset(preset)}
                        className="relative rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/60 cursor-pointer group transition-all"
                      >
                        <img src={preset.image} alt={preset.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                        <div className="p-2.5 bg-[#170e28]/90 space-y-1">
                          <p className="text-xs font-semibold text-white truncate">{preset.name}</p>
                          <p className="text-[10px] text-gray-400 line-clamp-2">{preset.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Display Processed / Captured Preview */}
                {imagePreview && (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <img
                      src={showHudOverlay && analysisResult?.annotated_image ? analysisResult.annotated_image : imagePreview}
                      alt="Analyzed Face"
                      className="w-full h-full object-contain"
                    />

                    {/* Retake / Reset Overlay Button */}
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setAnalysisResult(null);
                        if (activeTab === 'camera') startCamera();
                      }}
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-gray-200 hover:text-white text-xs font-medium border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake / Change</span>
                    </button>

                    {/* HUD Toggle */}
                    {analysisResult?.annotated_image && (
                      <button
                        onClick={() => setShowHudOverlay(!showHudOverlay)}
                        className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm border transition-all cursor-pointer ${
                          showHudOverlay
                            ? 'bg-pink-600/90 text-white border-pink-400'
                            : 'bg-black/70 text-gray-300 border-white/20'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{showHudOverlay ? 'OpenCV AR HUD: Active' : 'Show OpenCV AR HUD'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Loading Scanning Animation */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
                      <ScanFace className="w-8 h-8 text-pink-400 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-white">Running OpenCV 5.0 YuNet Analysis...</p>
                      <p className="text-xs text-gray-400">Extracting landmarks, ITA skin undertone & facial geometry</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hardware / Engine Footer Info */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-2">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OpenCV YuNet 5.0 Face DNN</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Local Real-time Processing</span>
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Real-Time Diagnostic Dashboard */}
            <div className="lg:col-span-5 space-y-4">
              {analysisResult ? (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Face Shape Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a102e] to-[#130b20] border border-pink-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-pink-400 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Face Shape Morphology
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {Math.round(analysisResult.face_shape_confidence * 100)}% Match
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <h4 className="font-display font-extrabold text-2xl text-white">
                        {analysisResult.face_shape}
                      </h4>
                      <span className="text-xs text-gray-400">
                        ({analysisResult.facial_regions.landmarks_count || 5} landmark geometry nodes)
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                      {analysisResult.face_shape_guide}
                    </p>
                  </div>

                  {/* Skin Tone & Undertone Panel */}
                  <div className="p-4 rounded-2xl bg-[#160d26] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" /> Skin Tone & Undertone
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">
                        ITA: {analysisResult.ita_score}°
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400">Shade Category</span>
                        <p className="text-xs font-bold text-white truncate">{analysisResult.skin_tone}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400">Undertone</span>
                        <p className="text-xs font-bold text-pink-300 truncate">{analysisResult.skin_undertone}</p>
                      </div>
                    </div>

                    {/* Skin Color Swatch Chip */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded-lg border-2 border-white/30 shadow-inner"
                          style={{ backgroundColor: analysisResult.skin_hex }}
                        />
                        <div>
                          <span className="text-[10px] text-gray-400 block">Extracted Skin Hex</span>
                          <span className="text-xs font-mono font-bold text-white">{analysisResult.skin_hex}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyHex(analysisResult.skin_hex)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHex ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Flattering Colors */}
                  <div className="p-4 rounded-2xl bg-[#160d26] border border-white/10 space-y-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-rose-400 block">
                      Flattering Palette For Your Undertone
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {analysisResult.flattering_colors.map((hex, i) => (
                        <div
                          key={i}
                          onClick={() => handleCopyHex(hex)}
                          className="w-8 h-8 rounded-xl border border-white/20 cursor-pointer hover:scale-110 active:scale-95 transition-transform shadow-md"
                          style={{ backgroundColor: hex }}
                          title={`Click to copy: ${hex}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Diagnostics Scores */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Lighting</span>
                        <SunMedium className="w-3 h-3 text-amber-400" />
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{analysisResult.lighting_quality}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Symmetry & Tilt</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-xs font-semibold text-emerald-300">{analysisResult.symmetry_score}% Alignment</p>
                    </div>
                  </div>

                  {/* Pro Makeup Tips */}
                  <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 block">
                      Bespoke Beauty Strategy
                    </span>
                    <ul className="text-[11px] text-gray-300 space-y-1 list-disc pl-4">
                      {analysisResult.makeup_tips.map((tip, idx) => (
                        <li key={idx} className="leading-snug">{tip}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              ) : (
                <div className="h-full min-h-[340px] flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-[#140c24] border border-white/5 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                    <ScanFace className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="font-semibold text-sm text-white">No Face Analyzed Yet</h4>
                    <p className="text-xs text-gray-400">
                      Snap a selfie with your camera, upload a photo, or choose a preset to generate full OpenCV facial diagnostics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#140c24] border-t border-white/10">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!analysisResult}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Face Profile to AI Looks</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { LookOption, TutorialStep } from '../types';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Camera as CameraIcon, 
  Layers, 
  Maximize2,
  Trophy,
  AlertCircle,
  Video,
  VideoOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CameraCoachProps {
  look: LookOption;
  onExit: () => void;
}

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastLandmarksRef = useRef<any[] | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const currentStep: TutorialStep = look.tutorial_steps[currentStepIndex] || look.tutorial_steps[0];
  const activeRegion = currentStep.face_region || 'cheekbone';

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

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      // 1. Acquire Webcam Stream with flexible constraint fallbacks
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
        console.warn("Retrying getUserMedia with basic constraints:", e);
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

      // 2. Initialize MediaPipe FaceMesh in background
      try {
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

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
        console.warn("MediaPipe FaceMesh CDN background init warning:", fmErr);
      }

      // 3. Start high-performance 60FPS render loop
      const renderLoop = async () => {
        const canvas = canvasRef.current;
        const vid = videoRef.current;

        if (canvas && vid && vid.readyState >= 2) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Mirror video feed horizontally for natural mirror feel
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Draw AR Overlays
            const landmarks = lastLandmarksRef.current;
            if (landmarks && landmarks.length > 0) {
              drawArOverlays(ctx, canvas, landmarks, activeRegion, showMeshOutline);
            } else {
              // Draw gentle HUD alignment guide if no landmarks yet
              drawAlignmentGuide(ctx, canvas, activeRegion);
            }
          }

          // Send frame to FaceMesh if not busy
          if (faceMeshRef.current && !isProcessingRef.current && vid.readyState >= 3) {
            isProcessingRef.current = true;
            faceMeshRef.current.send({ image: vid }).catch(() => {
              isProcessingRef.current = false;
            });
          }
        }

        animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      };

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? "Camera permission was denied. Please allow camera access in your browser's address bar to use the live AR Mirror."
          : "Webcam not detected or busy in another application. Please check your camera connection."
      );
      setCameraLoading(false);
      setCameraActive(false);
    }
  }, [activeRegion, showMeshOutline]);

  useEffect(() => {
    startWebcamAndAR();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [startWebcamAndAR]);

  const drawArOverlays = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    landmarks: any[],
    region: string,
    showMesh: boolean
  ) => {
    // MediaPipe landmarks x are already un-mirrored when drawing in normal coordinate space,
    // so we mirror the x coordinates: (1 - pt.x) * canvas.width
    const getX = (pt: any) => (1 - pt.x) * canvas.width;
    const getY = (pt: any) => pt.y * canvas.height;

    // Optional full face mesh wireframe dots
    if (showMesh) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < landmarks.length; i += 4) {
        const pt = landmarks[i];
        ctx.beginPath();
        ctx.arc(getX(pt), getY(pt), 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    if (region === 'cheekbone') {
      const leftCheek = landmarks[116];
      const rightCheek = landmarks[345];

      if (leftCheek && rightCheek) {
        const glowRadius = 32 + Math.sin(Date.now() / 200) * 4;

        // Left Cheek Apex
        const lx = getX(leftCheek);
        const ly = getY(leftCheek);
        const gLeft = ctx.createRadialGradient(lx, ly, 4, lx, ly, glowRadius);
        gLeft.addColorStop(0, 'rgba(236, 72, 153, 0.7)');
        gLeft.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

        ctx.fillStyle = gLeft;
        ctx.beginPath();
        ctx.arc(lx, ly, glowRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Right Cheek Apex
        const rx = getX(rightCheek);
        const ry = getY(rightCheek);
        const gRight = ctx.createRadialGradient(rx, ry, 4, rx, ry, glowRadius);
        gRight.addColorStop(0, 'rgba(236, 72, 153, 0.7)');
        gRight.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

        ctx.fillStyle = gRight;
        ctx.beginPath();
        ctx.arc(rx, ry, glowRadius, 0, 2 * Math.PI);
        ctx.fill();

        // High-precision reticles
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 18, 0, 2 * Math.PI);
        ctx.arc(rx, ry, 18, 0, 2 * Math.PI);
        ctx.stroke();

        // Upward sweep trajectory arrow
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 28, ly - 22);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 28, ry - 22);
        ctx.stroke();
        ctx.setLineDash([]);
      }

    } else if (region === 'lips') {
      const lipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 146, 91, 181, 84, 17];
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2.5;

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

    } else if (region === 'eyelid') {
      const leftEyeLid = [246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
      const rightEyeLid = [466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263];

      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;

      // Left Eye
      ctx.beginPath();
      leftEyeLid.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (!pt) return;
        if (i === 0) ctx.moveTo(getX(pt), getY(pt));
        else ctx.lineTo(getX(pt), getY(pt));
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Eye
      ctx.beginPath();
      rightEyeLid.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (!pt) return;
        if (i === 0) ctx.moveTo(getX(pt), getY(pt));
        else ctx.lineTo(getX(pt), getY(pt));
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (region === 'eyeliner') {
      const leftLash = [33, 246, 161, 160, 159, 158, 157, 173, 133];
      const rightLash = [263, 466, 388, 387, 386, 385, 384, 398, 362];

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.beginPath();
      leftLash.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (!pt) return;
        if (i === 0) ctx.moveTo(getX(pt), getY(pt));
        else ctx.lineTo(getX(pt), getY(pt));
      });
      const leftOuter = landmarks[130] || landmarks[33];
      if (leftOuter) {
        ctx.lineTo(getX(leftOuter) + 14, getY(leftOuter) - 8);
      }
      ctx.stroke();

      ctx.beginPath();
      rightLash.forEach((idx, i) => {
        const pt = landmarks[idx];
        if (!pt) return;
        if (i === 0) ctx.moveTo(getX(pt), getY(pt));
        else ctx.lineTo(getX(pt), getY(pt));
      });
      const rightOuter = landmarks[359] || landmarks[263];
      if (rightOuter) {
        ctx.lineTo(getX(rightOuter) - 14, getY(rightOuter) - 8);
      }
      ctx.stroke();
    }
  };

  const drawAlignmentGuide = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, region: string) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Glowing face frame guide
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, canvas.width * 0.26, canvas.height * 0.36, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Region target pulse indicator
    if (region === 'cheekbone') {
      ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
      ctx.beginPath();
      ctx.arc(cx - 70, cy + 10, 24, 0, 2 * Math.PI);
      ctx.arc(cx + 70, cy + 10, 24, 0, 2 * Math.PI);
      ctx.fill();
    } else if (region === 'lips') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 70, 36, 16, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < look.tutorial_steps.length - 1) {
      if (!completedSteps.includes(currentStep.step)) {
        setCompletedSteps(prev => [...prev, currentStep.step]);
      }
      setCurrentStepIndex(prev => prev + 1);
    } else {
      if (!completedSteps.includes(currentStep.step)) {
        setCompletedSteps(prev => [...prev, currentStep.step]);
      }
      setIsFinished(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const toggleStepCompleted = (stepNum: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepNum) ? prev.filter(s => s !== stepNum) : [...prev, stepNum]
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Hidden Source Video Element (Offscreen) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
      />

      {/* Top Mirror Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#140c22] border border-pink-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Live AR Mirror
            </span>
            <h2 className="font-display font-extrabold text-xl text-white">{look.name}</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Step {currentStep.step} of {look.tutorial_steps.length}: <span className="text-pink-300 font-semibold">{currentStep.title}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${
              speechEnabled
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
            title={speechEnabled ? 'Voice Guidance Active' : 'Voice Muted'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowMeshOutline(!showMeshOutline)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showMeshOutline
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Toggle FaceMesh Points"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 transition-colors"
          >
            <span>Exit Mirror</span>
          </button>
        </div>
      </div>

      {/* Main AR Canvas & Interactive Guidance Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Camera Viewport */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-pink-500/40 bg-black flex items-center justify-center">
            
            {/* Main Mirror AR Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-cover"
            />

            {/* Loading Indicator */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-[#0d0914]/90 flex flex-col items-center justify-center space-y-3 z-20">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                <p className="text-sm font-semibold text-white">Accessing Camera Feed...</p>
                <p className="text-xs text-gray-400">Initializing real-time video stream & MediaPipe mesh</p>
              </div>
            )}

            {/* Error Overlay with Retry */}
            {cameraError && (
              <div className="absolute inset-0 bg-[#0d0914]/95 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-sm font-semibold text-rose-300 max-w-sm">{cameraError}</p>
                <button
                  onClick={startWebcamAndAR}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow-lg transition-all"
                >
                  Retry Camera Connection
                </button>
              </div>
            )}

            {/* Top Live Region & Face Tracking Indicator */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-xl border border-pink-500/30 backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400' : 'bg-pink-500 animate-ping'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
                Target: {activeRegion}
              </span>
              <span className="text-[10px] text-gray-400">
                {faceDetected ? '• 468-pt Mesh Locked' : '• Center Face'}
              </span>
            </div>

            {/* Bottom Floating Instruction Strip */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#120b1e]/90 text-white p-3.5 rounded-xl backdrop-blur-md border border-pink-500/30 shadow-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold text-pink-400 uppercase tracking-wider">
                  Live AR Directive • {currentStep.technique}
                </span>
                {currentStep.estimated_time_sec && (
                  <span className="text-[11px] text-gray-400">⏱ ~{currentStep.estimated_time_sec}s</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-100">{currentStep.instruction}</p>
            </div>
          </div>

          {/* Navigation Controls under Camera */}
          <div className="w-full flex items-center justify-between mt-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-gray-200 border border-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <span className="text-xs text-gray-400 font-medium">
              Step {currentStepIndex + 1} of {look.tutorial_steps.length}
            </span>

            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
            >
              <span>{currentStepIndex === look.tutorial_steps.length - 1 ? 'Finish Routine 🎉' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Steps Checklist & Pro Tips */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Step Sequence Checklist */}
          <div className="p-5 rounded-2xl bg-[#140c22] border border-pink-500/20 space-y-4">
            <h4 className="font-display font-bold text-sm text-gray-200 uppercase tracking-wider flex items-center justify-between">
              <span>Tutorial Sequence</span>
              <span className="text-xs text-pink-400 font-mono">
                {completedSteps.length}/{look.tutorial_steps.length} Done
              </span>
            </h4>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {look.tutorial_steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isDone = completedSteps.includes(step.step);

                return (
                  <div
                    key={step.step}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isActive
                        ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                        : isDone
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-gray-300'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStepCompleted(step.step);
                      }}
                      className="mt-0.5 focus:outline-none"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          isDone ? 'text-emerald-400 fill-emerald-400/20' : 'text-gray-500'
                        }`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{step.title}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{step.face_region} • {step.technique}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Tip Card */}
          {currentStep.pro_tip && (
            <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Pro Makeup Tip
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                {currentStep.pro_tip}
              </p>
            </div>
          )}

          {/* Routine Completion Card */}
          {isFinished && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-black border border-pink-500/40 text-center space-y-3 animate-fadeIn">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
              <h4 className="font-display font-extrabold text-base text-white">Routine Complete!</h4>
              <p className="text-xs text-gray-300">
                You have mastered all steps for {look.name}. Your look is now perfectly calibrated with your outfit and facial harmony.
              </p>
              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow-lg transition-all"
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

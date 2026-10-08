import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Check, 
  RefreshCw, 
  Palette, 
  ScanFace, 
  CheckCircle2, 
  ChevronRight, 
  Sliders,
  FolderOpen,
  Eye
} from 'lucide-react';
import { RecommendRequest, OutfitAttributes, FaceProfile } from '../types';
import { analyzeOutfit } from '../services/api';

interface UploadWizardProps {
  onGenerate: (payload: RecommendRequest) => void;
  isLoading: boolean;
  faceProfile?: FaceProfile | null;
  onOpenFaceAnalyzer: () => void;
}

const ATELIER_PRESETS = [
  {
    name: "Rose Silk",
    dominant: "#801235",
    secondary: "#d9a566",
    undertone: "Warm Autumn",
    style: "Traditional",
    formality: "Black Tie",
    dominantDesc: "Primary Fabric Pigment - 64.2%",
    secondaryDesc: "Lining & Filament - 21.8%",
    sampleLabel: "evening_gown_silk.jpg",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Champagne",
    dominant: "#b45309",
    secondary: "#fde68a",
    undertone: "Golden Hour",
    style: "Modern",
    formality: "Cocktail",
    dominantDesc: "Shimmer Satin Weave - 58.4%",
    secondaryDesc: "Luminous Accent - 26.1%",
    sampleLabel: "champagne_gala_slip.jpg",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Emerald",
    dominant: "#065f46",
    secondary: "#f59e0b",
    undertone: "Deep Jewel",
    style: "Elegant",
    formality: "Gala Formal",
    dominantDesc: "Forest Velvet Pigment - 71.0%",
    secondaryDesc: "Gold Thread Weave - 18.5%",
    sampleLabel: "emerald_evening_velvet.jpg",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Midnight Navy",
    dominant: "#1e3a8a",
    secondary: "#c084fc",
    undertone: "Cool Twilight",
    style: "Bold / Editorial",
    formality: "Black Tie",
    dominantDesc: "Midnight Sapphire - 66.8%",
    secondaryDesc: "Lilac Iridescence - 22.3%",
    sampleLabel: "sapphire_silk_cape.jpg",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80"
  }
];

const VANITY_BAG_PRODUCTS = [
  { id: 'lip-001', label: 'Berry Lipstick' },
  { id: 'lip-002', label: 'Nude Rose Lipstick' },
  { id: 'eye-001', label: 'Bronze Eyeshadow' },
  { id: 'eye-002', label: 'Precision Eyeliner' },
  { id: 'chk-001', label: 'Peach Blush' },
  { id: 'chk-002', label: 'Rose Highlighter' },
  { id: 'lip-004', label: 'Hydrating Lip Oil' },
];

export const UploadWizard: React.FC<UploadWizardProps> = ({ 
  onGenerate, 
  isLoading,
  faceProfile,
  onOpenFaceAnalyzer
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Rose Silk');
  const [sampleFileName, setSampleFileName] = useState<string>('evening_gown_silk.jpg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form State
  const [intensity, setIntensity] = useState<'Natural' | 'Moderate' | 'Glam'>('Moderate');
  const [style, setStyle] = useState<'Elegant' | 'Traditional' | 'Modern' | 'Bold' | 'Minimal'>('Traditional');
  const [occasion, setOccasion] = useState('Wedding Reception / Formal Evening');
  const [timeOfDay, setTimeOfDay] = useState('Evening (Ambient Warm Light • 2700K)');
  const [budget, setBudget] = useState('$$ (Balanced)');
  const [existingProducts, setExistingProducts] = useState<string[]>(['lip-001', 'lip-002', 'chk-001']);
  const [inspiration, setInspiration] = useState('');

  // Outfit Attributes
  const [outfitColors, setOutfitColors] = useState<OutfitAttributes>({
    dominant_color: '#801235',
    secondary_color: '#d9a566',
    style: 'Traditional',
    formality: 'Black Tie',
    palette: ['#801235', '#d9a566', '#1a1618']
  });

  const [dominantName, setDominantName] = useState('Rose Silk (Dominant)');
  const [dominantDesc, setDominantDesc] = useState('Primary Fabric Pigment - 64.2%');
  const [secondaryName, setSecondaryName] = useState('Ochre Champagne (Accent)');
  const [secondaryDesc, setSecondaryDesc] = useState('Lining & Filament - 21.8%');
  const [detectedUndertone, setDetectedUndertone] = useState('Warm Autumn');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setSampleFileName(file.name);
    setIsAnalyzing(true);
    try {
      const extracted = await analyzeOutfit(file);
      setOutfitColors(extracted);
      setDominantName('Custom Dominant');
      setDominantDesc('Extracted Dominant Tone');
      setSecondaryName('Custom Accent');
      setSecondaryDesc('Extracted Secondary Hue');
      setDetectedUndertone('Multimodal Calibrated');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset: typeof ATELIER_PRESETS[0]) => {
    setSelectedPresetName(preset.name);
    setImagePreview(preset.image);
    setSampleFileName(preset.sampleLabel);
    setDominantName(`${preset.name} (Dominant)`);
    setDominantDesc(preset.dominantDesc);
    setSecondaryName(`Accent Shade`);
    setSecondaryDesc(preset.secondaryDesc);
    setDetectedUndertone(preset.undertone);

    setOutfitColors({
      dominant_color: preset.dominant,
      secondary_color: preset.secondary,
      style: preset.style,
      formality: preset.formality,
      palette: [preset.dominant, preset.secondary, '#111827']
    });
    setStyle(preset.style as any);
  };

  const toggleExistingProduct = (id: string) => {
    setExistingProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: RecommendRequest = {
      user_profile: {
        preferred_intensity: intensity,
        preferred_style: style,
      },
      occasion,
      time_of_day: timeOfDay,
      budget,
      existing_products: existingProducts,
      outfit_attributes: outfitColors,
      inspiration_summary: inspiration || undefined,
      face_profile: faceProfile || undefined
    };
    onGenerate(payload);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 animate-fadeIn">
      
      {/* Editorial Page Header */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold tracking-widest text-[#701a35] uppercase flex items-center gap-2">
          <span>• EDITORIAL STUDIO</span>
          <span>•</span>
          <span>MULTIMODAL COLOR HARMONY</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1a1618] font-display">
          Synchronize Your Look with Gemma 4
        </h1>
        <p className="text-gray-600 max-w-3xl text-sm md:text-base leading-relaxed">
          Upload your outfit, extract precise undertones via computer vision K-Means clustering, and receive bespoke makeup routines taught through real-time AR camera guidance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: Outfit & Color Palette Analysis */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-[#701a35] text-white text-xs font-bold">
              1
            </span>
            <h2 className="font-display font-bold text-base text-[#1a1618]">
              Outfit & Color Palette Analysis <span className="font-normal text-gray-500">— Upload an outfit photo or choose a preset for instant K-Means chromatic extraction</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Card: Upload Zone & Presets */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#f0e4e2] p-6 shadow-sm flex flex-col justify-between space-y-6">
              
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border border-dashed border-[#e6d3d0] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
                  imagePreview ? 'bg-gray-50' : 'bg-[#fcf8f7] hover:bg-[#faeeec]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative w-full h-44 flex items-center justify-center overflow-hidden rounded-lg">
                    <img
                      src={imagePreview}
                      alt="Outfit Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-white text-[#701a35] text-xs font-semibold shadow-md">
                        Click to change photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#fbebe8] flex items-center justify-center text-[#701a35]">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1618]">Click or drag outfit photo</p>
                      <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, or WEBP calibrated to high-res up to 10MB</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#fcedec] hover:bg-[#f8dbd8] text-[#701a35] text-xs font-semibold border border-[#f3d7d4] transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse Local Atelier Files</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sample indicator */}
              <div className="flex items-center justify-end text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[#701a35]" />
                  <span>Sample: {sampleFileName}</span>
                </span>
              </div>

              {/* Quick Atelier Presets */}
              <div className="space-y-2 border-t border-[#f5eae8] pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[10px] tracking-wider text-gray-600 uppercase">
                    QUICK ATELIER PRESETS
                  </span>
                  <span className="text-gray-400 text-[11px]">Pre-sampled fabric textures</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ATELIER_PRESETS.map((preset) => {
                    const isSelected = selectedPresetName === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all border ${
                          isSelected
                            ? 'bg-[#fcedec] border-[#701a35] text-[#701a35] font-semibold'
                            : 'bg-white hover:bg-gray-50 border-[#eee0dd] text-gray-700'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: preset.dominant }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Card: K-Means Extracted Palette */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#f0e4e2] p-6 shadow-sm flex flex-col justify-between space-y-5">
              
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1a1618]">
                    <Palette className="w-4 h-4 text-[#701a35]" />
                    <span>K-Means Extracted Palette</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CALIBRATED
                  </span>
                </div>

                {/* Dominant Color */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#fdfaf9] border border-[#f5eae8]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: outfitColors.dominant_color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1a1618]">{dominantName}</h4>
                      <p className="text-[11px] text-gray-500">{dominantDesc}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-white border border-[#eee0dd] text-gray-800">
                    {outfitColors.dominant_color.toUpperCase()}
                  </span>
                </div>

                {/* Secondary Color */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#fdfaf9] border border-[#f5eae8]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: outfitColors.secondary_color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1a1618]">{secondaryName}</h4>
                      <p className="text-[11px] text-gray-500">{secondaryDesc}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-white border border-[#eee0dd] text-gray-800">
                    {outfitColors.secondary_color.toUpperCase()}
                  </span>
                </div>

                {/* Aesthetic Vector Box */}
                <div className="p-4 rounded-xl bg-[#fcf5f4] border border-[#f3e1de] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    AESTHETIC VECTOR DETECTION
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Undertone</span>
                      <span className="font-bold text-[#1a1618]">{detectedUndertone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Style Vibe</span>
                      <span className="font-bold text-[#1a1618]">{outfitColors.style}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Formality</span>
                      <span className="font-bold text-[#1a1618]">{outfitColors.formality}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Note */}
              <div className="flex items-start gap-2 text-[11px] text-gray-500 pt-2 border-t border-[#f5eae8]">
                <Sparkles className="w-4 h-4 text-[#701a35] flex-shrink-0 mt-0.5" />
                <p>
                  Extracted chromatic vectors feed directly into Gemma 4's multimodal visual prompt for zero-mismatch harmonic alignment.
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* SECTION 2: OpenCV Facial Morphology & Skin Calibration */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-[#701a35] text-white text-xs font-bold">
              2
            </span>
            <h2 className="font-display font-bold text-base text-[#1a1618]">
              Facial Morphology & Skin Calibration (OpenCV) <span className="font-normal text-gray-500">— Precision YuNet landmark extraction & ITA undertone calculation</span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#f0e4e2] p-6 shadow-sm space-y-4">
            {faceProfile ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#fdf8f7] border border-[#f3dedb]">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: faceProfile.skin_hex || '#e2ab86' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#1a1618]">
                        {faceProfile.face_shape} Face Shape
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        Calibrated
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {faceProfile.skin_tone} • <span className="text-[#701a35] font-semibold">{faceProfile.skin_undertone}</span> ({faceProfile.skin_hex})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenFaceAnalyzer}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#701a35] hover:bg-[#581429] text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View OpenCV AR HUD</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenFaceAnalyzer}
                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                  >
                    Re-Scan Face
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={onOpenFaceAnalyzer}
                className="p-5 rounded-xl bg-[#fdfaf9] hover:bg-[#fcedec] border border-dashed border-[#e6d3d0] hover:border-[#701a35] cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#fbebe8] flex items-center justify-center text-[#701a35]">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1a1618]">Calibrate Face with OpenCV (Recommended)</h4>
                    <p className="text-xs text-gray-500">
                      Snap a live webcam selfie or upload a photo to detect your face shape, ITA skin shade, and undertone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFaceAnalyzer();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#701a35] hover:bg-[#581429] text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Launch Face Analyzer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Styling Preferences & Context */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-[#701a35] text-white text-xs font-bold">
              3
            </span>
            <h2 className="font-display font-bold text-base text-[#1a1618]">
              Styling Preferences & Context <span className="font-normal text-gray-500">— Calibrate intensity, event parameters, and product inventory</span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#f0e4e2] p-6 shadow-sm space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Intensity Calibration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Target Intensity Calibration</label>
                <div className="grid grid-cols-3 gap-2 bg-[#f8f1f0] p-1 rounded-xl">
                  {(['Natural', 'Moderate', 'Glam'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        intensity === lvl
                          ? 'bg-[#701a35] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500">
                  {intensity === 'Natural' && 'Subtle dewy enhancement highlighting natural bone structure.'}
                  {intensity === 'Moderate' && 'Soft rosewood tone emphasis with clean satin skin finish.'}
                  {intensity === 'Glam' && 'High-contrast graphic wing & foiled metallic lids for maximum presence.'}
                </p>
              </div>

              {/* Aesthetic Archetype */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Aesthetic Archetype</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className="w-full bg-[#fdfaf9] border border-[#eee0dd] rounded-xl px-4 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#701a35]"
                >
                  <option value="Elegant">Elegant & Polished</option>
                  <option value="Traditional">Traditional / Heritage</option>
                  <option value="Modern">Modern Minimalist</option>
                  <option value="Bold">Bold / Editorial</option>
                  <option value="Minimal">Clean Girl / Minimal</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Balances classical symmetry with modern editorial finish.
                </p>
              </div>

              {/* Occasion */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Occasion</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-[#fdfaf9] border border-[#eee0dd] rounded-xl px-4 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#701a35]"
                >
                  <option value="Wedding Reception / Formal Evening">Wedding Reception / Formal Evening</option>
                  <option value="Cocktail Gala / Black Tie Soirée">Cocktail Gala / Black Tie Soirée</option>
                  <option value="High-Fashion Runway / Editorial Shoot">High-Fashion Runway / Editorial Shoot</option>
                  <option value="Daytime Garden Party / Festive Lunch">Daytime Garden Party / Festive Lunch</option>
                  <option value="Date Night / Golden Hour Lounge">Date Night / Golden Hour Lounge</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Calibrated for camera flashes and dimmed social venue lighting.
                </p>
              </div>

              {/* Time of Day & Lighting */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Time of Day & Lighting</label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full bg-[#fdfaf9] border border-[#eee0dd] rounded-xl px-4 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#701a35]"
                >
                  <option value="Evening (Ambient Warm Light • 2700K)">Evening (Ambient Warm Light • 2700K)</option>
                  <option value="Golden Hour (Direct Sunlight • 3500K)">Golden Hour (Direct Sunlight • 3500K)</option>
                  <option value="Daytime (Neutral Daylight • 5500K)">Daytime (Neutral Daylight • 5500K)</option>
                  <option value="Night Club / Flash Photography">Night Club / Flash Photography</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Shifts pigment contrast to prevent artificial washouts.
                </p>
              </div>

            </div>

            {/* Products in Your Vanity Bag */}
            <div className="space-y-3 pt-2 border-t border-[#f5eae8]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Products in Your Vanity Bag
                </label>
                <span className="text-[11px] text-gray-400">
                  Optional inventory — Select formulas already in your cosmetic collection to prioritize
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {VANITY_BAG_PRODUCTS.map((prod) => {
                  const isSelected = existingProducts.includes(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => toggleExistingProduct(prod.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-[#fcedec] text-[#701a35] border-[#f3d7d4] font-semibold'
                          : 'bg-white text-gray-600 border-[#eee0dd] hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[#701a35] border-[#701a35] text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>{prod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION & STATUS BAR */}
        <div className="bg-white rounded-2xl border border-[#f0e4e2] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">FaceMesh 468-pt active</span>
            <span className="text-gray-300">•</span>
            <span>Gemma 4 Multimodal Computer Vision</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">Latency &lt; 1.2s</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#701a35] hover:bg-[#581429] text-white font-display font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemma 4 Reasoning in Progress...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate 3 Curated Looks</span>
              </>
            )}
          </button>

        </div>

      </form>

      {/* Editorial Footer */}
      <footer className="pt-8 pb-12 border-t border-[#f0e4e2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          <span className="font-bold text-[#1a1618]">GlamSync AI</span> — Editorial personal color analysis & calibrated beauty intelligence.
        </div>
        <div className="flex items-center gap-6">
          <button type="button" className="hover:text-gray-900 transition-colors">Palettes</button>
          <button type="button" className="hover:text-gray-900 transition-colors">Lookbook</button>
          <button type="button" className="hover:text-gray-900 transition-colors">Profile</button>
          <span>© 2026 GlamSync AI Atelier. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
};

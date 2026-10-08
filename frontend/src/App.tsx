import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadWizard } from './components/UploadWizard';
import { LookCard } from './components/LookCard';
import { CameraCoachCanvas } from './components/CameraCoachCanvas';
import { ProductDrawer } from './components/ProductDrawer';
import { FaceAnalyzerModal } from './components/FaceAnalyzerModal';
import { SavedLooksDrawer } from './components/SavedLooksDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { 
  RecommendRequest, 
  GemmaLookResponse, 
  LookOption, 
  ProductItem, 
  FaceProfile, 
  FaceAnalysisResult,
  SavedLookItem,
  HistoryItem
} from './types';
import { 
  recommendLooks, 
  fetchProducts, 
  checkBackendHealth,
  fetchSavedLooks,
  saveLookToBackend,
  deleteSavedLookFromBackend,
  fetchHistory,
  clearHistoryFromBackend
} from './services/api';
import { Sparkles, ArrowLeft, RefreshCw, Layers, Shield, Cpu, ScanFace, Bookmark, History } from 'lucide-react';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'wizard' | 'coach'>('wizard');
  const [lookResponse, setLookResponse] = useState<GemmaLookResponse | null>(null);
  const [selectedLook, setSelectedLook] = useState<LookOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isFaceAnalyzerOpen, setIsFaceAnalyzerOpen] = useState(false);
  const [isSavedLooksOpen, setIsSavedLooksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [faceProfile, setFaceProfile] = useState<FaceProfile | null>(null);
  const [lastFaceAnalysis, setLastFaceAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [savedLooks, setSavedLooks] = useState<SavedLookItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    // Initial data load
    fetchProducts().then(setProducts);
    checkBackendHealth().then(setSystemHealth);
    fetchSavedLooks().then(setSavedLooks);
    fetchHistory().then(setHistory);
  }, []);

  const handleGenerate = async (payload: RecommendRequest) => {
    setIsLoading(true);
    try {
      const res = await recommendLooks(payload);
      setLookResponse(res);
      // Refresh history
      fetchHistory().then(setHistory);
      // Auto-scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('look-results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLookForCoach = (look: LookOption) => {
    setSelectedLook(look);
    setActiveView('coach');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFaceProfile = (profile: FaceProfile, analysis: FaceAnalysisResult) => {
    setFaceProfile(profile);
    setLastFaceAnalysis(analysis);
    fetchHistory().then(setHistory);
  };

  const handleSaveLook = async (look: LookOption) => {
    const item: SavedLookItem = {
      title: look.name,
      look,
      face_profile: faceProfile || undefined,
      occasion: 'Atelier Curated Look'
    };
    const saved = await saveLookToBackend(item);
    setSavedLooks(prev => [saved, ...prev.filter(l => l.id !== saved.id)]);
    fetchHistory().then(setHistory);
  };

  const handleDeleteSavedLook = async (id: string) => {
    await deleteSavedLookFromBackend(id);
    setSavedLooks(prev => prev.filter(l => l.id !== id));
  };

  const handleClearHistory = async () => {
    await clearHistoryFromBackend();
    setHistory([]);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      activeView === 'coach' ? 'bg-[#0b0813] text-gray-100' : 'bg-[#faf5f4] text-[#1a1618]'
    }`}>
      
      {/* Top Navigation */}
      <Navbar
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenFaceAnalyzer={() => setIsFaceAnalyzerOpen(true)}
        onOpenSavedLooks={() => setIsSavedLooksOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        faceCalibrated={!!faceProfile}
        savedLooksCount={savedLooks.length}
        activeView={activeView}
        onNavigateHome={() => {
          setActiveView('wizard');
          setSelectedLook(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 md:py-12">
        {activeView === 'coach' && selectedLook ? (
          <CameraCoachCanvas
            look={selectedLook}
            onExit={() => {
              setActiveView('wizard');
            }}
          />
        ) : (
          <div className="space-y-16">
            {/* Step 1, 2, 3: Outfit Analysis, OpenCV Face Calibration & Preferences Wizard */}
            <UploadWizard 
              onGenerate={handleGenerate} 
              isLoading={isLoading} 
              faceProfile={faceProfile}
              onOpenFaceAnalyzer={() => setIsFaceAnalyzerOpen(true)}
            />

            {/* Step 4: Generated 3 Looks Display */}
            {lookResponse && (
              <div id="look-results" className="space-y-8 pt-8 border-t border-[#f0e4e2]">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fcedec] border border-[#f3d7d4] text-[#701a35] text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Multimodal Analysis Complete</span>
                  </div>
                  <h2 className="font-display font-extrabold text-3xl md:text-4xl text-[#1a1618]">
                    Your 3 Curated <span className="gradient-text">Gemma 4</span> Looks
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 max-w-xl mx-auto">
                    {faceProfile ? (
                      <span>
                        Harmonized for your <strong className="text-[#701a35]">{faceProfile.face_shape}</strong> face shape & <strong className="text-[#701a35]">{faceProfile.skin_undertone}</strong> undertone.
                      </span>
                    ) : (
                      'Select any look below to enter the live real-time AR Camera Mirror for step-by-step landmark tracking and guidance.'
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {lookResponse.looks.map((look, idx) => (
                    <LookCard
                      key={look.id || idx}
                      look={look}
                      index={idx}
                      onSelectLook={handleSelectLookForCoach}
                      onSaveLook={handleSaveLook}
                      isSaved={savedLooks.some(s => s.look.id === look.id || s.title === look.name)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Product Catalog Drawer */}
      <ProductDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        products={products}
      />

      {/* Saved Looks Drawer */}
      <SavedLooksDrawer
        isOpen={isSavedLooksOpen}
        onClose={() => setIsSavedLooksOpen(false)}
        savedLooks={savedLooks}
        onSelectLookForCoach={handleSelectLookForCoach}
        onDeleteSavedLook={handleDeleteSavedLook}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />

      {/* OpenCV Face Analyzer Modal */}
      <FaceAnalyzerModal
        isOpen={isFaceAnalyzerOpen}
        onClose={() => setIsFaceAnalyzerOpen(false)}
        onApplyProfile={handleApplyFaceProfile}
        currentProfile={faceProfile}
      />

    </div>
  );
};
export default App;

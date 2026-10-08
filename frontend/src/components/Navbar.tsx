import React from 'react';
import { Sparkles, Video, ShoppingBag, User, ScanFace, Bookmark, History } from 'lucide-react';

interface NavbarProps {
  onOpenCatalog: () => void;
  onOpenFaceAnalyzer: () => void;
  onOpenSavedLooks: () => void;
  onOpenHistory: () => void;
  activeView: 'wizard' | 'coach';
  onNavigateHome: () => void;
  faceCalibrated?: boolean;
  savedLooksCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCatalog,
  onOpenFaceAnalyzer,
  onOpenSavedLooks,
  onOpenHistory,
  activeView,
  onNavigateHome,
  faceCalibrated,
  savedLooksCount = 0
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#faf5f4]/95 backdrop-blur-md border-b border-[#f0e4e2] px-6 lg:px-12 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Vision Active Badge */}
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 text-left group focus:outline-none cursor-pointer"
          >
            <span className="font-display font-bold text-xl tracking-tight text-[#1a1618]">
              GlamSync
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#f0e4e2] text-[#701a35]">
              AI
            </span>
          </button>

          {/* Gemma 4 Vision Active Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemma 4 Vision Active</span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          <button
            onClick={onNavigateHome}
            className={`transition-colors cursor-pointer ${
              activeView === 'wizard'
                ? 'text-[#701a35] font-semibold underline underline-offset-8 decoration-2 decoration-[#701a35]'
                : 'hover:text-gray-900'
            }`}
          >
            Diagnostic
          </button>
          
          <button
            onClick={onOpenFaceAnalyzer}
            className="hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ScanFace className="w-4 h-4 text-[#701a35]" />
            <span>Face Analysis</span>
            {faceCalibrated && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#701a35]" />
            )}
          </button>

          <button
            onClick={onOpenCatalog}
            className="hover:text-gray-900 transition-colors cursor-pointer"
          >
            Catalog
          </button>

          <button
            onClick={onOpenSavedLooks}
            className="hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Saved Looks</span>
            {savedLooksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#fcedec] text-[#701a35] text-[10px] font-bold">
                {savedLooksCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenHistory}
            className="hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>History</span>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFaceAnalyzer}
            className="sm:hidden p-2 rounded-xl bg-white border border-[#f0e4e2] text-[#701a35] shadow-sm"
            title="OpenCV Face Analyzer"
          >
            <ScanFace className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSavedLooks}
            className="md:hidden p-2 rounded-xl bg-white border border-[#f0e4e2] text-[#701a35] shadow-sm"
            title="Saved Looks Vault"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {activeView === 'coach' ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#701a35] hover:bg-[#581429] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Exit AR Mirror</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const el = document.getElementById('look-results');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else onOpenFaceAnalyzer();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5ebd9] hover:bg-[#edd9be] border border-[#e8d5b7] text-[#701a35] text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>AR Coach</span>
            </button>
          )}

          {/* Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#701a35] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>

      </div>
    </header>
  );
};

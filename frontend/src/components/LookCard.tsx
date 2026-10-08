import React, { useState } from 'react';
import { Camera, Sparkles, Eye, Smile, Flame, CheckCircle2, ChevronRight, Clock, Bookmark, Check } from 'lucide-react';
import { LookOption } from '../types';

interface LookCardProps {
  look: LookOption;
  index: number;
  onSelectLook: (look: LookOption) => void;
  onSaveLook?: (look: LookOption) => void;
  isSaved?: boolean;
}

export const LookCard: React.FC<LookCardProps> = ({ 
  look, 
  index, 
  onSelectLook,
  onSaveLook,
  isSaved = false
}) => {
  const isRecommended = index === 1 || look.id.includes('recommended');
  const isBold = index === 2 || look.id.includes('bold');
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    if (onSaveLook) {
      onSaveLook(look);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }
  };

  const getTierBadge = () => {
    if (isRecommended) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcedec] text-[#701a35] border border-[#f3d7d4] text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#701a35]" />
          Best AI Recommendation
        </span>
      );
    }
    if (isBold) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-xs font-bold tracking-wide">
          <Flame className="w-3.5 h-3.5 text-[#b45309]" />
          Bold Statement Look
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold tracking-wide">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Soft Natural Glow
      </span>
    );
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl transition-all duration-300 bg-white border p-6 md:p-7 space-y-6 shadow-sm group ${
        isRecommended
          ? 'border-[#701a35] shadow-xl shadow-[#701a35]/10 scale-[1.02]'
          : 'border-[#f0e4e2] hover:border-[#701a35]/50'
      }`}
    >
      {/* Card Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {getTierBadge()}
          <div className="flex items-center gap-1.5 bg-[#fdfaf9] px-2.5 py-1 rounded-full border border-[#eee0dd]">
            <span className="text-[11px] text-gray-500">Intensity:</span>
            <span className="text-xs font-bold text-[#701a35]">{look.intensity}/10</span>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold font-display text-[#1a1618] group-hover:text-[#701a35] transition-colors">
            {look.name}
          </h3>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            {look.reasoning}
          </p>
        </div>
      </div>

      {/* Feature Breakdown: Eyes, Cheeks, Lips */}
      <div className="space-y-3 bg-[#fdfaf9] rounded-xl p-4 border border-[#f5eae8] text-xs">
        <div className="flex items-start gap-2.5">
          <Eye className="w-4 h-4 text-[#701a35] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-800">Eyes: </span>
            <span className="text-gray-600">{look.makeup.eyes}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-800">Cheeks: </span>
            <span className="text-gray-600">{look.makeup.cheeks}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Smile className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-800">Lips: </span>
            <span className="text-gray-600">{look.makeup.lips}</span>
          </div>
        </div>
      </div>

      {/* Product Tag Pills */}
      {look.products && look.products.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matched Catalog:</span>
          <div className="flex flex-wrap gap-1.5">
            {look.products.map((prodId) => (
              <span
                key={prodId}
                className="px-2.5 py-0.5 rounded-md bg-[#fcf5f4] border border-[#f5eae8] text-[11px] font-mono text-[#701a35] font-semibold"
              >
                #{prodId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tutorial Steps Preview */}
      <div className="space-y-2 border-t border-[#f5eae8] pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold uppercase tracking-wider text-[11px]">AR Routine ({look.tutorial_steps.length} Steps)</span>
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-[#701a35]" />
            ~{Math.round(look.tutorial_steps.reduce((acc, s) => acc + (s.estimated_time_sec || 45), 0) / 60)} mins
          </span>
        </div>

        <ul className="space-y-1.5">
          {look.tutorial_steps.slice(0, 3).map((step) => (
            <li key={step.step} className="flex items-center gap-2 text-xs text-gray-700">
              <span className="w-4 h-4 rounded-full bg-[#fcedec] text-[#701a35] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {step.step}
              </span>
              <span className="truncate">{step.title}</span>
            </li>
          ))}
          {look.tutorial_steps.length > 3 && (
            <p className="text-[11px] text-gray-400 italic pl-6">+ {look.tutorial_steps.length - 3} more steps in AR mirror</p>
          )}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => onSelectLook(look)}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-semibold text-xs transition-all shadow-sm cursor-pointer ${
            isRecommended
              ? 'bg-[#701a35] hover:bg-[#581429] text-white shadow-[#701a35]/20'
              : 'bg-gray-900 hover:bg-[#701a35] text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Launch Live AR Mirror Coach</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {onSaveLook && (
          <button
            type="button"
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              justSaved || isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-[#eee0dd]'
            }`}
          >
            {justSaved || isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-[#701a35]" />}
            <span>{justSaved ? 'Saved to Vault ✓' : isSaved ? 'Saved in Vault' : 'Save to Personal Vault'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

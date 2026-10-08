import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Bookmark, 
  Trash2, 
  Video, 
  Calendar, 
  ChevronRight, 
  Palette,
  Check,
  Share2
} from 'lucide-react';
import { SavedLookItem, LookOption } from '../types';

interface SavedLooksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedLooks: SavedLookItem[];
  onSelectLookForCoach: (look: LookOption) => void;
  onDeleteSavedLook: (id: string) => void;
}

export const SavedLooksDrawer: React.FC<SavedLooksDrawerProps> = ({
  isOpen,
  onClose,
  savedLooks,
  onSelectLookForCoach,
  onDeleteSavedLook
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#f0e4e2] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-[#f0e4e2] flex items-center justify-between bg-[#faf5f4]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fcedec] flex items-center justify-center text-[#701a35]">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#1a1618]">Personal Look Vault</h3>
                <p className="text-xs text-gray-500">Saved curated styles & color pairings</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {savedLooks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-gray-400">
                <Bookmark className="w-10 h-10 stroke-1 text-gray-300" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">No Saved Looks Yet</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Click "Save to Vault" on any generated Gemma 4 look to keep it in your wardrobe archive.
                  </p>
                </div>
              </div>
            ) : (
              savedLooks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#f0e4e2] bg-[#fdfaf9] hover:border-[#701a35] p-5 space-y-4 transition-all shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#701a35] bg-[#fcedec] px-2 py-0.5 rounded">
                        {item.occasion || 'Editorial Look'}
                      </span>
                      <h4 className="font-display font-bold text-base text-[#1a1618] mt-1">
                        {item.title || item.look.name}
                      </h4>
                    </div>

                    <button
                      onClick={() => item.id && onDeleteSavedLook(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Outfit Palette Chips */}
                  {item.outfit_attributes && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#eee0dd] text-xs">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: item.outfit_attributes.dominant_color }}
                      />
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: item.outfit_attributes.secondary_color }}
                      />
                      <span className="text-[11px] text-gray-600 font-medium">
                        {item.outfit_attributes.style} • {item.outfit_attributes.dominant_color}
                      </span>
                    </div>
                  )}

                  {/* Makeup Overview */}
                  <div className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded-xl border border-[#eee0dd]">
                    <p><strong className="text-gray-800">Eyes:</strong> {item.look.makeup.eyes}</p>
                    <p><strong className="text-gray-800">Lips:</strong> {item.look.makeup.lips}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </span>

                    <button
                      onClick={() => {
                        onSelectLookForCoach(item.look);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#701a35] hover:bg-[#581429] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start AR Mirror</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#f0e4e2] bg-[#faf5f4] text-center text-xs text-gray-500">
            <span>{savedLooks.length} looks preserved in personal archive</span>
          </div>

        </div>
      </div>
    </div>
  );
};

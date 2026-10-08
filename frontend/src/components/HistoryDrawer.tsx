import React from 'react';
import { 
  X, 
  History, 
  Trash2, 
  Clock, 
  Sparkles, 
  ScanFace, 
  Palette, 
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#f0e4e2] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-[#f0e4e2] flex items-center justify-between bg-[#faf5f4]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fcedec] flex items-center justify-center text-[#701a35]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#1a1618]">Atelier Session History</h3>
                <p className="text-xs text-gray-500">Past look generations & OpenCV scans</p>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {history.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-gray-400">
                <History className="w-10 h-10 stroke-1 text-gray-300" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">No History Recorded Yet</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Every look generation and OpenCV face scan will appear in your timeline here.
                  </p>
                </div>
              </div>
            ) : (
              history.map((item, idx) => {
                const isLook = item.type === 'look_generation';
                const isFace = item.type === 'face_analysis';
                const isOutfit = item.type === 'outfit_analysis';

                return (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-[#f0e4e2] bg-[#fdfaf9] hover:bg-white hover:border-[#701a35] transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isLook && <Sparkles className="w-4 h-4 text-[#701a35]" />}
                        {isFace && <ScanFace className="w-4 h-4 text-pink-600" />}
                        {isOutfit && <Palette className="w-4 h-4 text-amber-600" />}
                        {!isLook && !isFace && !isOutfit && <Bookmark className="w-4 h-4 text-purple-600" />}
                        <span className="text-xs font-bold text-[#1a1618]">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.summary}
                    </p>

                    {item.details && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {item.details.dominant_color && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#eee0dd] text-[10px] font-mono font-medium text-gray-700">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.details.dominant_color }} />
                            {item.details.dominant_color}
                          </span>
                        )}
                        {item.details.face_shape && (
                          <span className="px-2 py-0.5 rounded bg-[#fcedec] text-[#701a35] text-[10px] font-semibold">
                            Shape: {item.details.face_shape}
                          </span>
                        )}
                        {item.details.skin_undertone && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                            {item.details.skin_undertone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Clear All */}
          <div className="p-4 border-t border-[#f0e4e2] bg-[#faf5f4] flex items-center justify-between">
            <span className="text-xs text-gray-500">{history.length} session entries</span>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

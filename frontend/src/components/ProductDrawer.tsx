import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, Tag, Check } from 'lucide-react';
import { ProductItem } from '../types';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({ isOpen, onClose, products }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedItems, setSavedItems] = useState<string[]>([]);

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const toggleSave = (id: string) => {
    setSavedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#130d20] h-full border-l border-pink-500/20 shadow-2xl flex flex-col">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">GlamSync Beauty Catalog</h3>
              <p className="text-xs text-gray-400">Deterministic local shade matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="p-4 border-b border-white/5 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((item) => {
            const isSaved = savedItems.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-pink-500/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 shadow-md border border-white/20"
                      style={{ backgroundColor: item.hex || '#e11d48' }}
                    />
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-gray-400">{item.brand} • <span className="capitalize">{item.finish || item.category}</span></p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-pink-400">
                    ₹{item.price}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="px-2 py-0.5 rounded bg-black/40 text-gray-400 font-mono text-[10px]">
                    ID: {item.id}
                  </span>
                  <button
                    onClick={() => toggleSave(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-pink-600/20 text-gray-300 hover:text-pink-300 border border-white/5'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>In Vanity</span>
                      </>
                    ) : (
                      <>
                        <Tag className="w-3.5 h-3.5" />
                        <span>Add to Vanity</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/30 text-center text-xs text-gray-500">
          Curated for NVIDIA RTX 5050 & Gemma 4 Multimodal Pipeline
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowDown, Plus } from 'lucide-react';
import { Field } from '../types';

interface HeroStoryProps {
  selectedField: Field | null;
  onExploreClick: () => void;
  onAddFieldClick?: () => void;
}

export const HeroStory: React.FC<HeroStoryProps> = ({
  selectedField,
  onExploreClick,
  onAddFieldClick
}) => {
  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-between rounded-3xl overflow-hidden bg-soil-950 text-white select-none shadow-elevated mb-12">
      {/* Purpose-Built Agricultural Cadastral Landscape Vector Abstraction */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#133E31] via-[#1B4D3E] to-[#14100D]">
        <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-furrows" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
              <line x1="0" y1="0" x2="0" y2="24" stroke="#349377" strokeWidth="1.5" strokeOpacity="0.4" />
            </pattern>
          </defs>
          {/* Layered Arable Parcels */}
          <polygon points="0,500 450,380 900,460 1200,390 1200,800 0,800" fill="#164337" opacity="0.7" />
          <polygon points="0,580 380,470 750,530 1200,480 1200,800 0,800" fill="url(#hero-furrows)" />
          <polygon points="0,640 500,560 880,620 1200,570 1200,800 0,800" fill="#1C1510" opacity="0.9" />
          {/* Cadastral Boundary Lines */}
          <line x1="450" y1="380" x2="500" y2="800" stroke="#C78520" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
          <line x1="900" y1="460" x2="880" y2="800" stroke="#C78520" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-[#14100D] via-[#14100D]/40 to-transparent" />
      </div>

      {/* Top Space & Eyebrow */}
      <div className="relative z-10 pt-24 sm:pt-28 px-6 sm:px-12 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="inline-flex items-center space-x-2 font-mono text-[10px] tracking-[0.3em] text-harvest-300 uppercase font-semibold bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>KRISHINET • FIELD INTELLIGENCE</span>
        </div>
      </div>

      {/* Main Confident Editorial Typography */}
      <div className="relative z-10 px-6 sm:px-12 lg:px-16 max-w-7xl mx-auto w-full py-12 sm:py-16">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif font-normal tracking-tight text-white leading-[1.02]">
            Know your field.<br />
            <span className="italic font-light text-moss-200">Grow with confidence.</span>
          </h1>

          <p className="text-base sm:text-xl lg:text-2xl text-white/85 font-sans font-light max-w-2xl leading-relaxed">
            Understand your crops, weather, soil and field conditions in one place.
          </p>

          {/* Clean Dual Primary Actions */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={onExploreClick}
              className="group px-7 py-3.5 rounded-full bg-white text-soil-950 font-sans font-semibold text-xs uppercase tracking-wider transition-all hover:bg-harvest-200 shadow-field flex items-center space-x-2.5 cursor-pointer"
            >
              <span>My Fields</span>
              <ArrowDown className="w-4 h-4 text-soil-700 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {onAddFieldClick && (
              <button
                onClick={onAddFieldClick}
                className="px-6 py-3.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/30 text-white font-sans font-semibold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-harvest-300" />
                <span>Add Field</span>
              </button>
            )}

            {selectedField && (
              <span className="hidden sm:inline-block font-mono text-xs text-white/70 pl-2">
                Active: <strong className="text-white font-medium">{selectedField.name}</strong> ({selectedField.crop_type})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Hint of Open Telemetry & Transition */}
      <div className="relative z-10 px-6 sm:px-12 lg:px-16 py-6 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-white/60 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <span>COPERNICUS STAC</span>
          <span>•</span>
          <span>OPEN-METEO</span>
          <span>•</span>
          <span>DETERMINISTIC AGRI RULES</span>
        </div>
        <button
          onClick={onExploreClick}
          className="text-[11px] text-harvest-300 hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
        >
          <span>SCROLL TO YOUR LAND</span>
          <span>↓</span>
        </button>
      </div>
    </section>
  );
};

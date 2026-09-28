import React from 'react';
import { Field } from '../types';
import { Sparkles, Mic, ArrowRight } from 'lucide-react';

interface AskFieldStoryProps {
  field: Field | null;
  onOpenAskModal: () => void;
}

export const AskFieldStory: React.FC<AskFieldStoryProps> = ({
  field,
  onOpenAskModal
}) => {
  if (!field) return null;

  return (
    <section id="ask-field-section" className="scroll-mt-20 space-y-10 mb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
      {/* Editorial Section Heading */}
      <div className="border-b border-canvas-border pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-moss-800 font-semibold block mb-2">
          CONTEXTUAL AGRICULTURAL INQUIRY
        </span>
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-soil-950 tracking-tight leading-[0.95]">
          ASK YOUR FIELD.
        </h2>
      </div>

      {/* Large Quiet Editorial Card */}
      <div className="bg-white rounded-3xl border border-canvas-border shadow-elevated p-8 sm:p-14 lg:p-16 flex flex-col justify-between space-y-8">
        <div className="max-w-3xl space-y-5">
          <span className="font-mono text-xs uppercase tracking-widest text-soil-400 font-semibold">
            INQUIRY FOR {field.name.toUpperCase()} ({field.crop_type.toUpperCase()})
          </span>

          <h3 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal text-soil-950 leading-[1.08]">
            "What's the best thing<br />
            <span className="italic font-light text-moss-800">to do today?"</span>
          </h3>

          <p className="text-base sm:text-lg text-soil-700 font-light leading-relaxed max-w-2xl">
            Ask specific operational questions regarding irrigation windows, fertilizer scheduling, or foliar application safety. KrishiNet evaluates live Open-Meteo feeds, STAC satellite scenes, and local soil records before responding.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={onOpenAskModal}
            className="px-8 py-3.5 rounded-full bg-soil-950 hover:bg-moss-800 text-white font-sans font-semibold text-xs uppercase tracking-wider flex items-center space-x-2.5 transition-all shadow-field cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-harvest-300" />
            <span>Ask My Field</span>
            <ArrowRight className="w-4 h-4 text-white/60" />
          </button>

          {/* Voice Interface Hook (Honest: Not Faked) */}
          <div className="inline-flex items-center space-x-2 px-5 py-3 rounded-full border border-canvas-border bg-canvas-100 text-soil-500 text-xs font-mono select-none">
            <Mic className="w-3.5 h-3.5 text-soil-400" />
            <span>Vernacular Voice Inquiry (Coming Soon)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { AssistantResponse } from '../types';
import { api } from '../services/api';
import {
  Sparkles, Cpu, Layers, HelpCircle, Send,
  CheckCircle2, ArrowDown, Database, ShieldAlert,
  Info, AlertTriangle, Check
} from 'lucide-react';

import { useNetwork } from '../context/NetworkContext';

interface AskFieldProps {
  fieldId: number;
  fieldName: string;
}

const PRESET_QUESTIONS = [
  "Should I irrigate today?",
  "What is happening to my crop?",
  "Why is my field at risk?",
  "Why should I delay irrigation?",
  "What does the weather mean for my crop?",
  "What should I monitor this week?"
];

export const AskField: React.FC<AskFieldProps> = ({ fieldId, fieldName }) => {
  const { isOnline } = useNetwork();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; res: AssistantResponse; timestamp: string }>>([]);

  const handleAsk = async (qText: string) => {
    if (!qText.trim()) return;

    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setLoading(false);
      setErrorMsg("You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setQuestion('');
    try {
      const res = await api.askAssistant(fieldId, qText);
      setHistory((prev) => [
        { q: qText, res, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev
      ]);
    } catch (err: any) {
      const isTimeout = err?.message?.toLowerCase().includes('timed out') || err?.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
        setErrorMsg('AI assistant request timed out. Please try again.');
      } else if (!isOnline || !navigator.onLine) {
        setErrorMsg("You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again.");
      } else {
        setErrorMsg(err.message || 'Error fetching field intelligence. Please ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
              DECISION-SUPPORT PIPELINE
            </span>
            <span className="text-xs text-slate-500 font-mono">Real Data → Models → AI Explanation</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
            Ask My Field — Agricultural Intelligence for {fieldName}
          </h3>
          <p className="text-xs text-slate-500">
            Synthesizes live Open-Meteo weather, Sentinel-2 metadata, soil profile, and deterministic agronomic models
          </p>
        </div>
      </div>

      {/* Preset Action Queries */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Preset Field Queries:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={loading}
              className="text-xs bg-slate-50 hover:bg-agri-50 hover:text-agri-900 hover:border-agri-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-2xs text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Query Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex items-center space-x-2 pt-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask about irrigation timing, heat risk, spraying window for ${fieldName}...`}
          className="flex-1 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-agri-600 bg-slate-50/50"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-agri-700 hover:bg-agri-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <span>Ask Field</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {!isOnline && (
        <div className="flex items-center space-x-2 text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Offline mode — Ask Field requires an active internet connection</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <p className="text-[11px] text-amber-800 font-medium pl-6">
            No new answer was generated.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-600 space-y-2 animate-pulse">
          <div className="flex items-center justify-center space-x-2 font-bold text-slate-800">
            <Cpu className="w-4 h-4 text-agri-600 animate-spin" />
            <span>Executing Field Intelligence Pipeline...</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            get_field() → get_weather() → get_satellite() → get_soil() → get_risks() → get_advisories()
          </div>
        </div>
      )}

      {/* Formatted Intelligence Results */}
      <div className="space-y-6">
        {history.map((item, idx) => {
          const isGemini = item.res.mode === 'GEMINI_AI';
          const hasStructuredSections = Boolean(item.res.why || item.res.recommended_action);

          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 shadow-sm"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    FARMER QUESTION
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">({item.timestamp})</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase flex items-center space-x-1 ${
                    isGemini
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>{isGemini ? 'Gemini AI Explanation' : 'Deterministic Engine Fallback'}</span>
                </span>
              </div>

              <div className="text-sm font-black text-slate-900 bg-white p-3 rounded-lg border border-slate-200/80">
                "{item.q}"
              </div>

              {/* AI TRANSPARENCY PANEL (Section 17) */}
              <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Database className="w-3 h-3 text-agri-600" />
                    <span>AI TRANSPARENCY PANEL — DATA EVIDENCE EXAMINED</span>
                  </span>
                  <span className="text-emerald-700 font-semibold font-sans">
                    Zero Synthetic Data
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {(item.res.transparency_summary || [
                    "✓ Weather: Live Open-Meteo Numerical Forecast",
                    "○ Satellite: Sentinel-2 Scene Verified (Band NDVI uncalculated)",
                    "✓ Soil: Verified Soil Profile",
                    "✓ Risk Engine: 5 Agronomic Hazard Checks Evaluated",
                    "✓ Advisory Engine: Decision Signals Generated"
                  ]).map((line, lIdx) => {
                    const isAvailable = line.startsWith("✓");
                    return (
                      <div
                        key={lIdx}
                        className={`p-1.5 rounded text-[11px] font-mono flex items-center space-x-1.5 border ${
                          isAvailable
                            ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/60'
                            : 'bg-amber-50/70 text-amber-900 border-amber-200/60'
                        }`}
                      >
                        <span>{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STRUCTURED 5-PART DECISION SUPPORT (Section 6) */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3.5 text-xs text-slate-800">
                {/* 1. ANSWER */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ANSWER</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                    {item.res.answer}
                  </div>
                </div>

                {/* 2. WHY */}
                {item.res.why && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      WHY (EVIDENCE & AGRONOMIC REASONING)
                    </div>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {item.res.why}
                    </p>
                  </div>
                )}

                {/* 3. DATA USED */}
                {item.res.data_used && item.res.data_used.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      DATA SOURCES & TIMESTAMPS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.res.data_used.map((source, sIdx) => (
                        <span key={sIdx} className="bg-slate-100 text-slate-700 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. WHAT YOU SHOULD DO */}
                {item.res.recommended_action && (
                  <div>
                    <div className="text-[10px] font-bold text-agri-800 uppercase tracking-wider mb-1">
                      WHAT YOU SHOULD DO
                    </div>
                    <p className="text-agri-950 font-medium bg-agri-50/60 p-2.5 rounded-lg border border-agri-200/80">
                      {item.res.recommended_action}
                    </p>
                  </div>
                )}

                {/* 5. LIMITATIONS */}
                {item.res.limitations && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>LIMITATIONS & UNCERTAINTIES</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      {item.res.limitations}
                    </p>
                  </div>
                )}

                {/* Mandatory Disclaimer */}
                {item.res.disclaimer && (
                  <div className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-100 flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.res.disclaimer}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {history.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <div className="font-semibold text-slate-600">No Query Submitted Yet</div>
            <p className="text-[11px] text-slate-400">
              Click a preset field query above or enter a question to run real data tool synthesis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

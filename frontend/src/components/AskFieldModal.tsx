import React, { useState } from 'react';
import { Field, AssistantResponse } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import {
  X, Send, Sparkles, AlertCircle, CheckCircle2,
  HelpCircle, ShieldCheck, Compass, MessageSquare
} from 'lucide-react';

interface AskFieldModalProps {
  field: Field | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AskFieldModal: React.FC<AskFieldModalProps> = ({ field, isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const { isOnline } = useNetwork();
  const [question, setQuestion] = useState<string>('Should I irrigate today?');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !field) return null;

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim()) return;

    // PRE-FLIGHT OFFLINE CHECK
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setLoading(false);
      setResponse(null);
      setErrorMsg(t('offlineAskField', "You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again."));
      return;
    }

    setLoading(true);
    setResponse(null); // Clear previous response immediately
    setErrorMsg(null);

    try {
      const res = await api.askAssistant(field.id, queryText, language);
      setResponse(res);
    } catch (err: any) {
      setResponse(null);
      const isTimeout = err?.message?.toLowerCase().includes('timed out') || err?.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
        setErrorMsg(t('askTimeout', 'AI assistant request timed out. Please try again.'));
      } else if (!isOnline || !navigator.onLine || err?.message?.includes('offline') || err?.message?.includes('internet connection')) {
        setErrorMsg(t('offlineAskField', "You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again."));
      } else {
        setErrorMsg(err.message || 'Failed to retrieve agricultural decision response.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSampleQuestions = (lang: string) => {
    if (lang === 'ta') {
      return [
        'இன்றைக்கு பாசனம் செய்யலாமா?',
        'மருந்து தெளிக்க வானிலை சரியா இருக்கா?',
        'இந்த வாரம் என்ன கவனிக்க வேண்டும்?',
        'மண் ஈரப்பதம் திருப்திகரமாக உள்ளதா?'
      ];
    }
    if (lang === 'hi') {
      return [
        'क्या मुझे आज सिंचाई करनी चाहिए?',
        'क्या फोलियर स्प्रे करना सुरक्षित है?',
        'इस सप्ताह मुझे क्या निगरानी करनी चाहिए?',
        'मौसम का जोखिम क्या है?'
      ];
    }
    return [
      'Should I irrigate today?',
      'Is it safe to spray foliar nutrients?',
      'What should I monitor this week?',
      'Why is my field at risk?'
    ];
  };

  const sampleQuestions = getSampleQuestions(language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl border border-[#E8E2D8] shadow-floating w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Talking with the Field */}
        <div className="p-6 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1B4D3E] flex items-center justify-center text-white shadow-subtle">
              <Sparkles className="w-5 h-5 text-[#FBDD97]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-[#1C1510] text-lg">
                  {t('conversationWith', 'Conversation with')} {field.name}
                </h3>
                <span className="font-mono text-[10px] bg-[#E8F5F0] text-[#1B4D3E] font-bold px-2 py-0.5 rounded">
                  {t('parcelNumber', 'PARCEL #')}{field.id}
                </span>
              </div>
              <p className="text-xs text-[#5C4535]">
                {field.crop_type} • {field.district ? `${field.district}, ` : ''}{field.state}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#786C60] hover:text-[#1C1510] hover:bg-[#E8E2D8] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Prompt Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[#786C60] font-bold uppercase tracking-wider block">
              {t('suggestedQuestions', 'Suggested Questions')}
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] hover:bg-[#E8F5F0] hover:border-[#BEE9DC] text-[#1C1510] text-xs font-medium transition-all text-left cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
              placeholder={t('askInputPlaceholder', `Ask anything about ${field.name}...`)}
              className="flex-1 px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white focus:border-[#1B4D3E] focus:outline-none text-xs text-[#1C1510] placeholder-[#786C60] transition-all font-sans"
            />
            <button
              onClick={() => handleAsk(question)}
              disabled={loading || !question.trim()}
              className="px-5 py-3 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] disabled:bg-[#E8E2D8] disabled:text-[#786C60] text-white font-semibold text-xs transition-all shadow-subtle flex items-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span>{t('saving', 'Thinking...')}</span>
              ) : (
                <>
                  <span>{t('askButton', 'Ask')}</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {!isOnline && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#B54708] bg-[#FEF6EE] border border-[#F9DBAF] px-3 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('offlineNoticeAskField', 'Offline mode — Ask Field requires active connection')}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center space-x-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium pl-6">
                {t('noNewAnswerGenerated', 'No new answer was generated.')}
              </p>
            </div>
          )}

          {/* Structured 5-Part Response & Transparency Panel */}
          {response && (
            <div className="space-y-5 border-t border-[#E8E2D8] pt-5">
              {/* AI Transparency Panel (Checklist of Data Streams) */}
              {response.transparency_summary && response.transparency_summary.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-[#1C1510]">
                      {t('openTelemetryRegistry', 'AI Data Transparency Panel')}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-[#E8E2D8] text-[#1B4D3E]">
                      {response.mode === 'GEMINI_AI' ? `✨ ${t('liveGeminiNotice', 'Live Gemini AI')}` : t('deterministicFallbackNotice', 'Deterministic Engine')}
                    </span>
                  </div>

                  <ul className="space-y-1 text-[11px] text-[#5C4535] font-mono">
                    {response.transparency_summary.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-[#1B4D3E]">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5-Part Decision Support Card */}
              <div className="space-y-3">
                {/* 1. Direct Answer */}
                <div className="p-4 rounded-2xl bg-[#E8F5F0] border border-[#BEE9DC] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#1B4D3E] block">
                    1. {t('directAnswer', 'DIRECT ANSWER')}
                  </span>
                  <p className="font-serif font-bold text-[#1C1510] text-base leading-snug">
                    {response.answer}
                  </p>
                </div>

                {/* 2. Why (Evidence) */}
                {response.why && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#786C60] block">
                      2. {t('agronomicWhy', 'WHY (TELEMETRY EVIDENCE)')}
                    </span>
                    <p className="text-xs text-[#1C1510] leading-relaxed font-sans">
                      {response.why}
                    </p>
                  </div>
                )}

                {/* 3. Data Used */}
                {response.data_used && response.data_used.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-1 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#786C60] block">
                      3. {t('verifiedSourcesCited', 'DATA USED')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {response.data_used.map((d, i) => (
                        <span key={i} className="text-[11px] bg-white border border-[#E8E2D8] px-2 py-0.5 rounded text-[#5C4535]">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. What You Should Do */}
                {response.recommended_action && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-800 block">
                      4. {t('recommendedAction', 'WHAT YOU SHOULD DO')}
                    </span>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed font-sans">
                      {response.recommended_action}
                    </p>
                  </div>
                )}

                {/* 5. Agronomic Limitations */}
                {response.limitations && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1 text-xs text-amber-900">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-700 block">
                      5. {t('limitations', 'LIMITATIONS')}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {response.limitations}
                    </p>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-[#786C60] italic text-center pt-2">
                {response.disclaimer || t('pathologyDisclaimer', 'AI-assisted agricultural decision support — verify ground soil conditions before executing.')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

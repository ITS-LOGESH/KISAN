import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import { api } from '../services/api';
import { Field, AssistantResponse } from '../types';
import { LoadingSkeleton } from '../design-system/LoadingSkeleton';
import {
  ArrowLeft,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sprout,
  Layers,
  HelpCircle
} from 'lucide-react';

export const AskFieldScreen: React.FC = () => {
  const { navigate, params } = useRouter();
  const { language, t } = useLanguage();
  const { isOnline } = useNetwork();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  // Auditable conversation history (cached for review, strictly separated from new questions)
  const [history, setHistory] = useState<Array<{ question: string; response: AssistantResponse; timestamp: string }>>(() => {
    try {
      const fieldKey = params?.fieldId || 'default';
      const stored = sessionStorage.getItem(`kisan_ask_history_${fieldKey}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // When selectedField changes, load that field's conversation history
  useEffect(() => {
    if (selectedField?.id) {
      try {
        const stored = sessionStorage.getItem(`kisan_ask_history_${selectedField.id}`);
        setHistory(stored ? JSON.parse(stored) : []);
      } catch {
        setHistory([]);
      }
    }
  }, [selectedField?.id]);

  // Set default localized question once language is known
  useEffect(() => {
    if (!question) {
      if (language === 'ta') {
        setQuestion('இன்றைக்கு பயிருக்கு பாசனம் செய்யலாமா?');
      } else if (language === 'hi') {
        setQuestion('क्या मुझे आज सिंचाई करनी चाहिए?');
      } else if (language === 'te') {
        setQuestion('ఈరోజు పొలానికి నీరు పెట్టవచ్చా?');
      } else if (language === 'kn') {
        setQuestion('ಇಂದು ಬೆಳೆಗೆ ನೀರಾವರಿ ಮಾಡಬಹುದೇ?');
      } else if (language === 'ml') {
        setQuestion('ഇന്ന് നനയ്ക്കുന്നത് ഉചിതമാണോ?');
      } else if (language === 'mr') {
        setQuestion('आज शेताला पाणी देणे योग्य आहे का?');
      } else if (language === 'bn') {
        setQuestion('আজ কি জমিতে সেচ দেওয়া উচিত?');
      } else {
        setQuestion('Should I irrigate today based on rain forecast?');
      }
    }
  }, [language]);

  useEffect(() => {
    api.getFields(true).then((data) => {
      setFields(data);
      if (data.length > 0) {
        if (params?.fieldId) {
          const match = data.find((f) => f.id === params.fieldId);
          setSelectedField(match || data[0]);
        } else {
          setSelectedField(data[0]);
        }
      }
      setPageLoading(false);
    }).catch(() => {
      setPageLoading(false);
    });
  }, [params?.fieldId]);

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || !selectedField) return;

    // PRE-FLIGHT OFFLINE CHECK:
    // If device is offline, DO NOT call Gemini, DO NOT wait for timeout,
    // DO NOT return fallback/random/cached previous answers as response to new question!
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setLoadingResponse(false);
      setResponse(null);
      setErrorMsg(t('offlineAskField', "You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again."));
      return;
    }

    setLoadingResponse(true);
    setResponse(null); // CRITICAL: Clear previous response immediately so it is NEVER shown as answer to new query
    setErrorMsg(null);

    try {
      // Pass the active language to backend Gemini reasoning engine
      const res = await api.askAssistant(selectedField.id, queryText.trim(), language);
      setResponse(res);
      // Persist to field conversation history
      const newEntry = {
        question: queryText.trim(),
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => {
        const updated = [newEntry, ...prev.slice(0, 9)];
        try {
          sessionStorage.setItem(`kisan_ask_history_${selectedField.id}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err: any) {
      console.error('Failed to get answer:', err);
      setResponse(null); // Ensure no old response or random response is displayed on failure
      const isTimeout = err?.message?.toLowerCase().includes('timed out') || err?.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
        setErrorMsg(t('askTimeout', 'AI assistant request timed out. Please try again.'));
      } else if (!isOnline || !navigator.onLine || err?.message?.includes('offline') || err?.message?.includes('internet connection')) {
        setErrorMsg(t('offlineAskField', "You're offline. Ask Field needs an internet connection to generate a new answer. Please reconnect and try again."));
      } else {
        setErrorMsg(err.message || 'Failed to retrieve agricultural decision response.');
      }
    } finally {
      setLoadingResponse(false);
    }
  };

  // Dynamic Multilingual Suggested Questions
  const getSuggestions = (lang: string): string[] => {
    if (lang === 'ta') {
      return [
        'இன்றைக்கு மழை வருமா? பாசனம் செய்யலாமா?',
        'தற்போது காற்று வேகம் எப்படி உள்ளது? மருந்து தெளிக்கலாமா?',
        'பயிரில் பூச்சி / நோய் தாக்குதல் அபாயம் உள்ளதா?',
        'பரிந்துரைக்கப்படும் உரமிடுதல் அட்டவணை என்ன?',
      ];
    }
    if (lang === 'hi') {
      return [
        'क्या आज बारिश की संभावना के आधार पर सिंचाई करनी चाहिए?',
        'क्या वर्तमान हवा की गति में पत्तियों पर छिड़काव सुरक्षित है?',
        'इस मौसम में प्रमुख कीट या रोग का जोखिम क्या है?',
        'उर्वरक और पोषण प्रबंधन के लिए अनुशंसित कार्यक्रम',
      ];
    }
    if (lang === 'te') {
      return [
        'వర్ష సూచన ఆధారంగా ఈరోజు నీరు పెట్టవచ్చా?',
        'ప్రస్తుత గాలి వేగంలో పిచიკారీ చేయడం సురక్షితమేనా?',
        'ఈ దశలో వచ్చే ముఖ్యమైన తెగుళ్ల నివారణ ఏమిటి?',
        'సిఫార్సు చేయబడిన ఎరువుల యాజమాన్యం',
      ];
    }
    if (lang === 'kn') {
      return [
        'ಇಂದು ಮಳೆಯ ಮುನ್ಸೂಚನೆ ಆಧರಿಸಿ ನೀರಾವರಿ ಮಾಡಬಹುದೇ?',
        'ಪ್ರಸ್ತುತ ಗಾಳಿಯ ವೇಗದಲ್ಲಿ ಸಿಂಪಡಣೆ ಮಾಡುವುದು ಸುರಕ್ಷಿತವೇ?',
        'ಈ ಹಂತದಲ್ಲಿ ಬರುವ ಪ್ರಮುಖ ರೋಗಗಳ ಲಕ್ಷಣಗಳೇನು?',
        'ಶಿಫಾರಸು ಮಾಡಿದ ಗೊಬ್ಬರ ನಿರ್ವಹಣೆ',
      ];
    }
    if (lang === 'ml') {
      return [
        'ഇന്ന് നനയ്ക്കുന്നത് ഉചിതമാണോ?',
        'ഇന്നത്തെ കാറ്റിൽ മരുന്ന് തളിക്കുന്നത് സുരക്ഷിതമാണോ?',
        'ഈ ഘട്ടത്തിൽ ഉണ്ടാകാൻ സാധ്യതയുള്ള കീടബാധകൾ',
        'വളപ്രയോഗത്തിനുള്ള നിർദ്ദേശങ്ങൾ',
      ];
    }
    if (lang === 'mr') {
      return [
        'पावसाच्या अंदाजानुसार आज पाणी देणे योग्य आहे का?',
        'सध्याच्या वाऱ्याच्या वेगात फवारणी करणे सुरक्षित आहे का?',
        'या अवस्थेत प्रमुख रोग आणि कीटकांचा धोका काय आहे?',
        'शिफारस केलेले खत व्यवस्थापन वेळापत्रक',
      ];
    }
    if (lang === 'bn') {
      return [
        'বৃষ্টির পূর্বাভাস অনুসারে আজ কি জমিতে সেচ দেওয়া উচিত?',
        'বর্তমান বাতাসের গতিতে স্প্রে করা কি নিরাপদ?',
        'এই সময়ে প্রধান বালাই বা রোগের ঝুঁকি কি?',
        'সুপারিশকৃত সার ও পুষ্টি ব্যবস্থাপনা',
      ];
    }
    return [
      'Should I irrigate today based on rain forecast?',
      'Is it safe to spray foliar nutrients in current wind?',
      'What are the main pest & disease risks right now?',
      'Recommended fertilizer and nutrient schedule',
    ];
  };

  const suggestions = getSuggestions(language);

  if (pageLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <LoadingSkeleton className="h-8 w-40" />
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (fields.length === 0 || !selectedField) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F5F0] text-[#1B4D3E] flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#1C1510]">
          {t('noFieldsYet', 'No fields registered yet')}
        </h2>
        <p className="text-xs text-[#786C60] max-w-md mx-auto">
          {t('noFieldsDesc', 'Add your farm boundaries to monitor live weather telemetry, soil records, and satellite observations.')}
        </p>
        <button
          onClick={() => navigate('add-field')}
          className="px-5 py-2.5 rounded-full bg-[#1B4D3E] text-white text-xs font-semibold shadow-subtle hover:bg-[#143C30] cursor-pointer"
        >
          {t('addField', '+ Add Field')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('home')}
            className="p-2 rounded-full border border-[#E8E2D8] bg-white text-[#5C4535] hover:text-[#1C1510] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1510] tracking-tight">
              {t('askFieldTitle', 'Ask My Field')}
            </h1>
            <p className="text-xs text-[#5C4535]">
              {t('askFieldSubtitle', 'Agricultural decision support grounded in live weather, soil and crop telemetry.')}
            </p>
          </div>
        </div>

        {/* Field Selector Dropdown if multiple fields */}
        {fields.length > 1 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#786C60] font-mono text-[11px] font-semibold">
              {t('fields', 'Field')}:
            </span>
            <select
              value={selectedField.id}
              onChange={(e) => {
                const target = fields.find((f) => f.id === parseInt(e.target.value, 10));
                if (target) {
                  setSelectedField(target);
                  setResponse(null);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-xs font-semibold text-[#1C1510] outline-none shadow-subtle cursor-pointer"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Field Context Header Pill */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] text-[#1B4D3E] flex items-center justify-center font-serif font-bold text-base shrink-0">
            <Sprout className="w-5 h-5 text-[#1B4D3E]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <strong className="font-serif font-bold text-[#1C1510] text-base">
                {t('conversationWith', 'Conversation with')} {selectedField.name}
              </strong>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#E8E2D8] text-[#786C60] font-bold">
                {t('parcelNumber', 'PARCEL #')}{selectedField.id}
              </span>
            </div>
            <p className="text-xs text-[#5C4535]">
              {selectedField.crop_type} {selectedField.variety ? `(${selectedField.variety})` : ''} • {selectedField.district ? `${selectedField.district}, ` : ''}{selectedField.state}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FAF8F4] border border-[#E8E2D8] text-[11px] font-mono text-[#786C60] self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
          <span>{t('openDataBadge', '₹0 OPEN DATA')}</span>
        </div>
      </div>

      {/* Prominent Text Input */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-5 shadow-elevated">
        <div className="space-y-1">
          <span className="font-mono text-xs uppercase tracking-widest text-[#1B4D3E] font-bold block">
            {t('welcomeTagline', 'DIGITAL AGRICULTURAL INTELLIGENCE')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1510] tracking-tight">
            {t('conversationWith', 'Conversation with')} {selectedField.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4535]">
            {t('askFieldSubtitle', 'KrishiNet combines live Open-Meteo weather, Sentinel-2 STAC scenes, and your registered crop parameters to provide practical operational advice.')}
          </p>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
              placeholder={t('askInputPlaceholder', 'Ask any question about irrigation, fertilization, weather risk, or spraying...')}
              className="w-full px-4 py-3.5 rounded-2xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium transition-all"
            />
          </div>

          <button
            onClick={() => handleAsk(question)}
            disabled={loadingResponse || !question.trim()}
            className="px-6 py-3.5 rounded-2xl bg-[#1B4D3E] hover:bg-[#153D31] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-subtle flex items-center justify-center space-x-2 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            {loadingResponse ? (
              <span>{t('saving', 'Analyzing...')}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FBDD97]" />
                <span>{t('askButton', 'Ask Field')}</span>
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

        {/* Dynamic Crop-Aware Suggested Question Chips */}
        <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
          <span className="text-[11px] font-mono text-[#786C60] font-bold uppercase tracking-wider block">
            {t('suggestedQuestions', 'Suggested questions')}:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q, idx) => (
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
      </div>

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

      {/* Loading Animation */}
      {loadingResponse && (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-8 text-center space-y-3 shadow-subtle animate-pulse">
          <Sparkles className="w-8 h-8 text-[#C78520] mx-auto animate-spin" />
          <h3 className="font-serif font-bold text-base text-[#1C1510]">
            {t('thinkingText', 'Analyzing field telemetry and running agronomic reasoning...')}
          </h3>
          <p className="text-xs text-[#786C60] max-w-md mx-auto font-sans">
            Checking Open-Meteo weather forecast, satellite STAC pass, and {selectedField.crop_type} telemetry.
          </p>
        </div>
      )}

      {/* Structured Decision Response */}
      {response && !loadingResponse && (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-elevated">
          {/* Top Transparency Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E8E2D8]">
            <span className="font-mono text-xs uppercase font-bold text-[#1B4D3E] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#C78520]" />
              <span>{t('aiAssistance', 'AI Decision Support')}</span>
            </span>

            {response.mode === 'GEMINI_AI' ? (
              <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F0] text-[#1B4D3E] border border-[#BEE9DC] flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#C78520]" />
                <span>{t('liveGeminiNotice', 'Live Gemini AI Reasoning')}</span>
              </span>
            ) : (
              <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-[#786C60] border border-[#E8E2D8] flex items-center space-x-1">
                <span>{t('deterministicFallbackNotice', 'Deterministic Advisory Engine')}</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* 1. Direct Answer */}
            <div className="p-5 rounded-2xl bg-[#E8F5F0] border border-[#BEE9DC] space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#1B4D3E] block">
                1. {t('directAnswer', 'DIRECT ANSWER')}
              </span>
              <p className="font-serif font-bold text-[#1C1510] text-lg sm:text-xl leading-snug">
                {response.answer}
              </p>
            </div>

            {/* 2. Why (Evidence) */}
            {response.why && (
              <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#786C60] block">
                  2. {t('agronomicWhy', 'WHY (TELEMETRY EVIDENCE)')}
                </span>
                <p className="text-xs sm:text-sm text-[#1C1510] leading-relaxed">
                  {response.why}
                </p>
              </div>
            )}

            {/* 3. Data Used */}
            {response.data_used && response.data_used.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-1.5 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#786C60] block">
                  3. {t('verifiedSourcesCited', 'DATA SOURCES CONSULTED')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {response.data_used.map((d, i) => (
                    <span key={i} className="text-[11px] bg-white border border-[#D5C2AD] px-2.5 py-1 rounded-lg text-[#1C1510] font-mono font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. What You Should Do */}
            {response.recommended_action && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-800 block">
                  4. {t('recommendedAction', 'WHAT YOU SHOULD DO')}
                </span>
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  {response.recommended_action}
                </p>
              </div>
            )}

            {/* 5. Agronomic Limitations */}
            {response.limitations && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1 text-xs text-amber-900">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-700 block">
                  5. {t('limitations', 'AGRONOMIC LIMITATIONS & CAVEATS')}
                </span>
                <p className="text-[11px] leading-relaxed">
                  {response.limitations}
                </p>
              </div>
            )}

            {/* AI Data Transparency Panel Checklist */}
            {response.transparency_summary && response.transparency_summary.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-[#1C1510]">
                    {t('openTelemetryRegistry', 'AI Data Transparency Checklist')}
                  </span>
                  <span className="text-[10px] font-mono text-[#786C60]">
                    {t('openDataBadge', 'Zero Hallucination Verified')}
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
          </div>

          <div className="text-[11px] text-[#786C60] italic text-center pt-2 border-t border-[#E8E2D8]">
            {response.disclaimer || t('pathologyDisclaimer', 'AI-assisted agricultural decision support — verify ground soil conditions before executing.')}
          </div>
        </div>
      )}

      {/* Past Conversations & Cached Historical Answers */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-5 shadow-subtle">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#786C60] font-bold">
                {t('pastConversations', 'Past Conversations & Cached Answers')}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {t('cachedHistoryBadge', 'HISTORICAL / CACHED')}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#786C60]">
              {history.length} {t('cachedEntries', 'saved')}
            </span>
          </div>

          <div className="space-y-3">
            {history.map((item, idx) => (
              <details key={idx} className="group bg-[#FAF8F4] rounded-2xl border border-[#E8E2D8] p-4 text-xs transition-all">
                <summary className="font-semibold text-[#1C1510] cursor-pointer list-none flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E8E2D8] text-[#786C60] font-bold">Q</span>
                    <span className="font-serif text-sm">"{item.question}"</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#786C60] shrink-0 ml-2">{item.timestamp}</span>
                </summary>
                <div className="mt-3 pt-3 border-t border-[#E8E2D8] space-y-2">
                  <div className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                    <span>{t('cachedAnswerLabel', 'Cached Answer for this Specific Question')}</span>
                  </div>
                  <p className="font-serif text-sm text-[#1C1510] leading-snug">{item.response.answer}</p>
                  {item.response.recommended_action && (
                    <div className="text-xs text-emerald-950 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                      <strong className="text-emerald-800 uppercase text-[10px] font-mono block mb-0.5">
                        {t('recommendedAction', 'WHAT YOU SHOULD DO')}
                      </strong>
                      {item.response.recommended_action}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

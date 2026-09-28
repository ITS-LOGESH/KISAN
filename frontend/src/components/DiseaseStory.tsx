import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Field, DiseaseAnalysisResult } from '../types';
import { SupportedLanguage, TamilDialect, localizeConfidenceLevel } from '../utils/i18n';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import {
  Camera,
  Upload,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  X,
  History,
  AlertCircle,
  FileCheck,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

interface DiseaseStoryProps {
  field: Field | null;
  language?: SupportedLanguage;
  tamilDialect?: TamilDialect;
}

export const DiseaseStory: React.FC<DiseaseStoryProps> = ({
  field,
  language = 'en',
  tamilDialect = 'standard',
}) => {
  const { t, language: contextLang } = useLanguage();
  const { isOnline } = useNetwork();
  const effectiveLang = language || contextLang || 'en';
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<DiseaseAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field Inspection History state
  const [history, setHistory] = useState<DiseaseAnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'screening' | 'history'>('screening');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch field inspection history whenever active field changes
  const loadHistory = async (fieldId: number) => {
    setLoadingHistory(true);
    try {
      const records = await api.getFieldDiseaseHistory(fieldId);
      setHistory(records);
    } catch (err) {
      console.error('Failed to load field disease history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (field?.id) {
      loadHistory(field.id);
      clearSelection();
    } else {
      setHistory([]);
    }
  }, [field?.id]);

  const processFile = (file: File) => {
    setErrorMsg(null);
    setResult(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(t('unsupportedFormat', 'Unsupported format. Please upload a PNG, JPG, or WebP photograph.'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(t('fileExceedsLimit', 'File exceeds 10MB limit. Please upload a standard mobile photo.'));
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setActiveTab('screening');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const runScreening = async () => {
    if (!selectedImage) return;

    // PRE-FLIGHT OFFLINE CHECK:
    // If device is offline, DO NOT send request, DO NOT wait for timeout, DO NOT generate fake results.
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setAnalyzing(false);
      setResult(null);
      setErrorMsg(t('offlineDiseaseCheck', "You're offline. Disease analysis requires an internet connection. Please reconnect and try again."));
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const analysis = await api.analyzeDiseaseImage(
        selectedImage,
        field?.id,
        field?.crop_type,
        effectiveLang
      );
      setResult(analysis);
      if (field?.id) {
        loadHistory(field.id);
      }
    } catch (err: any) {
      console.error('Screening failed:', err);
      setResult(null);
      const isTimeout = err?.message?.toLowerCase().includes('timed out') || err?.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
        setErrorMsg(t('screeningTimeout', 'Pathology screening request timed out. Please try again.'));
      } else if (!isOnline || !navigator.onLine || err?.message?.includes('offline') || err?.message?.includes('internet connection')) {
        setErrorMsg(t('offlineDiseaseCheck', "You're offline. Disease analysis requires an internet connection. Please reconnect and try again."));
      } else {
        setErrorMsg(err.message || t('screeningFailed', 'Pathology screening failed. Please check network connection.'));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  const activeCrop = field?.crop_type || t('registeredCrop', 'Registered Crop');

  return (
    <section id="check-crop" className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Hidden File Inputs for Native Camera and File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Screen Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#1B4D3E] font-semibold mb-1">
            <span>{t('plantHealthPathology', 'PLANT HEALTH & PATHOLOGY')}</span>
            {field && (
              <>
                <span>•</span>
                <span className="text-[#5C4535]">{field.name}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#1C1510] tracking-tight">
            {t('screenCropTitle', 'Check Crop')}
          </h1>
          <p className="text-sm text-[#5C4535] font-light mt-1">
            {field ? (
              <>
                Screening foliage contextualized for registered{' '}
                <strong className="font-semibold text-[#1C1510]">{field.crop_type}</strong>
                {field.variety ? ` (${field.variety})` : ''} in {field.district || field.state}.
              </>
            ) : (
              t('screenCropSubtitle', 'Screen leaf and crop photos for possible issues and IPM recommendations.')
            )}
          </p>
        </div>

        {/* Tab Toggle: Screening vs History */}
        <div className="flex items-center bg-[#FAF8F4] p-1 rounded-xl border border-[#E8E2D8] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('screening')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'screening'
                ? 'bg-[#1B4D3E] text-white shadow-subtle'
                : 'text-[#5C4535] hover:text-[#1C1510]'
            }`}
          >
            {t('foliarScreening', 'Foliar Screening')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#1B4D3E] text-white shadow-subtle'
                : 'text-[#5C4535] hover:text-[#1C1510]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t('history', 'History')} ({history.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FOLIAR SCREENING ================= */}
      {activeTab === 'screening' && (
        <div className="space-y-6">
          {!previewUrl ? (
            /* Purpose-Built Foliar Scanner Hero (ZERO Stock Imagery) */
            <div className="relative rounded-3xl overflow-hidden border border-[#E8E2D8] bg-[#141C18] text-white p-8 sm:p-12 shadow-elevated">
              {/* Background Foliar Optical Scanner Vector Geometry */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg className="w-full h-full" viewBox="0 0 800 500" fill="none">
                  {/* Subtle Leaf Venation Curves */}
                  <path
                    d="M100 450 C250 350, 400 250, 700 80"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                  <path
                    d="M250 350 C320 280, 450 290, 550 240"
                    stroke="#34D399"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M400 250 C480 180, 600 210, 680 160"
                    stroke="#34D399"
                    strokeWidth="1.5"
                  />
                  {/* Optical Reticle Crosshairs */}
                  <circle cx="400" cy="250" r="120" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 6" />
                  <circle cx="400" cy="250" r="60" stroke="#F59E0B" strokeWidth="1" />
                  <line x1="260" y1="250" x2="540" y2="250" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.6" />
                  <line x1="400" y1="110" x2="400" y2="390" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.6" />
                </svg>
              </div>

              {/* Main Scanner Call to Action Content */}
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#A7F3D0] font-mono text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#FBDD97]" />
                  <span>{t('plantHealthPathology', 'REGISTERED CROP PATHOLOGY SCREENING')}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-snug">
                  {t('inspectFoliageFrom', 'Inspect foliage from')} {field ? field.name : t('yourField', 'your field')}.
                </h2>

                <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed">
                  Evaluates visible spots, rusts, chlorosis, and blights against known pathology patterns for{' '}
                  <strong className="font-semibold text-[#FBDD97]">{activeCrop}</strong> in Indian conditions.
                </p>

                {/* Primary Upload / Camera Actions */}
                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF8F4] text-[#1C1510] font-sans font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-subtle cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4 text-[#1B4D3E]" />
                    <span>{t('takePhoto', 'Take Photo')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-sans font-semibold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-white" />
                    <span>{t('uploadPhoto', 'Upload Leaf Photo')}</span>
                  </button>
                </div>
              </div>

              {/* Helpful Photography Tips for Farmers */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/70">
                <div className="flex items-start space-x-2">
                  <span className="font-mono font-bold text-[#FBDD97]">01</span>
                  <span>{t('photoTip1', 'Frame a single leaf or symptomatic foliar area clearly.')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-mono font-bold text-[#FBDD97]">02</span>
                  <span>{t('photoTip2', 'Use natural daylight without heavy hand shadows.')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-mono font-bold text-[#FBDD97]">03</span>
                  <span>{t('photoTip3', 'Hold phone 15–20 cm away for sharp focus.')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded User Photo Review & Screening */
            <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-elevated p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Uploaded User Image */}
                <div className="w-full lg:w-1/2 relative rounded-2xl overflow-hidden border border-[#E8E2D8] bg-[#181310] max-h-[440px] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Uploaded foliar specimen"
                    className="w-full max-h-[440px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                    title={t('removePhoto', 'Remove photo')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Screening Controls / Analysis Results */}
                <div className="w-full lg:w-1/2 space-y-5">
                  {!result && (
                    <div className="space-y-4">
                      <div className="text-xs text-[#5C4535] bg-[#FAF8F4] p-3.5 rounded-xl border border-[#E8E2D8]">
                        <div className="flex items-center space-x-2 mb-1">
                          <Info className="w-4 h-4 text-[#1B4D3E]" />
                          <span className="font-bold text-[#1C1510]">{t('readyForPathology', 'Ready for Pathology Screening')}</span>
                        </div>
                        <div>
                          {t('evaluatingContext', 'Evaluating photo in the context of registered crop')}{' '}
                          <strong className="text-[#1B4D3E] font-semibold">{activeCrop}</strong>.
                        </div>
                      </div>

                      {!isOnline && (
                        <div className="flex items-center space-x-2 text-xs font-mono text-[#B54708] bg-[#FEF6EE] border border-[#F9DBAF] px-3 py-2 rounded-xl">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('offlineNoticeShort', 'Offline mode — foliage analysis requires active connection')}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={runScreening}
                        disabled={analyzing}
                        className="w-full py-4 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-subtle cursor-pointer transition-all disabled:opacity-50"
                      >
                        {analyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-[#FBDD97]" />
                            <span>{t('screeningFoliage', 'Screening foliage pathology...')}</span>
                          </>
                        ) : (
                          <span>{t('screenPhotoBtn', 'Screen Leaf Health')}</span>
                        )}
                      </button>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                        <span>{errorMsg}</span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium pl-6">
                        {t('noNewAnalysisPerformed', 'No new foliar analysis was performed.')}
                      </p>
                    </div>
                  )}

                  {/* Structured Screening Output */}
                  {result && (
                    <div className="space-y-5">
                      {/* Crop Context Tag & History Confirmation */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D8] pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E8F5F0] text-[#1B4D3E] border border-[#BEE9DC]">
                            {t('cropContext', 'Crop Context')}: {result.crop_context || activeCrop}
                          </span>
                          {result.model_used?.toLowerCase().includes('gemini') ? (
                            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5F0] text-[#1B4D3E] border border-[#BEE9DC] flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-[#C78520]" />
                              <span>{t('liveGeminiNotice', 'Live Gemini Reasoning Model')}</span>
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-[#786C60] border border-[#E8E2D8] flex items-center space-x-1">
                              <span>{t('offlinePathologyRules', 'Offline Pathology Rules')}</span>
                            </span>
                          )}
                        </div>

                        {result.saved_to_history && (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('savedToHistory', 'Saved to Field History')}</span>
                          </span>
                        )}
                      </div>

                      {/* Possible Issue */}
                      <div className="space-y-1">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#786C60] font-bold">
                          {t('possibleIssue', 'POSSIBLE ISSUE')}
                        </span>
                        <h3 className="text-2xl font-serif font-bold text-[#1C1510] leading-tight">
                          {result.detected_issue || t('noCriticalAbnormality', 'No Critical Abnormality Identified')}
                        </h3>
                        <span className="text-xs font-mono text-[#5C4535]">
                          {t('confidenceAssessment', 'Confidence Assessment')}: <strong>{localizeConfidenceLevel(result.confidence_level, t)}</strong>
                        </span>
                      </div>

                      {/* What This Means */}
                      <div className="space-y-1">
                        <span className="font-mono text-xs uppercase tracking-wider text-[#786C60] font-bold">
                          {t('whatThisMeans', 'WHAT THIS MEANS')}
                        </span>
                        <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                          {result.visible_symptoms ||
                            t('visualMarkersNormal', 'Visual markers are consistent with standard seasonal foliage development.')}
                        </p>
                      </div>

                      {/* Practical IPM Advice */}
                      {result.suggested_actions && result.suggested_actions.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-mono text-xs uppercase tracking-wider text-[#786C60] font-bold">
                            {t('practicalAdvice', 'PRACTICAL ADVICE & IPM ACTIONS')}
                          </span>
                          <ul className="space-y-2 text-xs text-[#5C4535]">
                            {result.suggested_actions.map((act, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-[#1B4D3E] shrink-0 mt-0.5" />
                                <span className="leading-relaxed text-[#1C1510]">{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Engine attribution */}
                      <div className="text-[11px] font-mono text-[#786C60] flex items-center justify-between pt-2 border-t border-[#E8E2D8]">
                        <span className="flex items-center space-x-1.5">
                          {result.model_used?.toLowerCase().includes('gemini') ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-[#C78520]" />
                              <span className="font-semibold text-[#1B4D3E]">{t('liveMultimodalAi', 'Live Multimodal AI')}: {result.model_used}</span>
                            </>
                          ) : (
                            <span>{t('offlineRules', 'Offline Rules')}: {result.model_used}</span>
                          )}
                        </span>
                        <span>{new Date(result.analyzed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Statutory Legal Screening Disclaimer */}
                      <div className="p-3.5 rounded-xl bg-[#FEF8E7] border border-[#FDEEC4] text-xs text-[#7E4B14] flex items-start space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#C78520] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong>{t('pathologyDisclaimer', 'AI-assisted screening — not laboratory diagnosis.')}</strong> {t('kvkConsultRecommendation', 'For statutory certification or chemical prescriptions, consult your local Krishi Vigyan Kendra (KVK).')}
                        </span>
                      </div>

                      {/* Scan Another Photo Button */}
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="w-full py-2.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF8F4] text-xs font-semibold text-[#1C1510] transition-colors"
                      >
                        {t('screenAnotherPhoto', '+ Screen Another Leaf Photo')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: FIELD SCREENING HISTORY ================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-elevated p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#786C60] font-bold">
                {t('auditableFieldRecord', 'AUDITABLE FIELD RECORD')}
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1C1510] mt-0.5">
                {t('foliarInspectionHistory', 'Foliar Inspection History')}
              </h2>
              <p className="text-xs text-[#5C4535] mt-0.5">
                {field
                  ? `${t('archivedInspectionsFor', 'Archived visual inspections recorded for parcel:')} ${field.name}`
                  : t('selectFieldForHistory', 'Select a field to view archived pathology records.')}
              </p>
              <p className="text-[11px] text-[#786C60] font-mono mt-1">
                {t('historyTabExplainer', 'Past inspections are archived below. These records reflect historical scans and are never shown as the current result.')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('screening')}
              className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
            >
              {t('newLeafInspection', '+ New Leaf Inspection')}
            </button>
          </div>

          {loadingHistory && (
            <div className="py-8 text-center text-xs font-mono text-[#786C60]">
              {t('loadingHistory', 'Loading historical inspection records...')}
            </div>
          )}

          {!loadingHistory && history.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-8 h-8 text-[#786C60] mx-auto opacity-50" />
              <h4 className="font-serif font-bold text-[#1C1510] text-sm">
                {t('noInspectionsYet', 'No inspections recorded yet')}
              </h4>
              <p className="text-xs text-[#5C4535] max-w-sm mx-auto font-light">
                {t('whenYouScreenNotice', 'When you screen foliar photos for {name}, verified records will be logged here.').replace('{name}', field ? field.name : t('yourField', 'your field'))}
              </p>
            </div>
          )}

          {!loadingHistory && history.length > 0 && (
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F4] flex flex-col sm:flex-row items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <strong className="font-serif font-bold text-[#1C1510] text-base">
                        {record.detected_issue}
                      </strong>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E8E2D8] text-[#5C4535]">
                        {localizeConfidenceLevel(record.confidence_level, t)} {t('confidence', 'Confidence')}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        {t('historicalRecordBadge', 'PAST INSPECTION')}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C4535] max-w-xl font-light">
                      {record.visible_symptoms}
                    </p>
                    <div className="font-mono text-[11px] text-[#786C60] flex flex-wrap items-center gap-1.5 pt-1">
                      <span>{t('context', 'Context')}: {record.crop_context || activeCrop}</span>
                      <span>•</span>
                      {record.model_used?.toLowerCase().includes('gemini') ? (
                        <span className="text-[#1B4D3E] font-medium inline-flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-[#C78520]" />
                          <span>{record.model_used}</span>
                        </span>
                      ) : (
                        <span>{t('engine', 'Engine')}: {record.model_used}</span>
                      )}
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-[#786C60] whitespace-nowrap self-start">
                    {new Date(record.analyzed_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

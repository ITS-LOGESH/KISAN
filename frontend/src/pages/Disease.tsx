import React, { useState } from 'react';
import { DiseaseAnalysisResult } from '../types';
import { api } from '../services/api';
import {
  UploadCloud, AlertTriangle, ShieldCheck, CheckCircle2,
  FileImage, Activity, RefreshCw, AlertCircle, X, Info
} from 'lucide-react';

export const Disease: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setErrorMsg(null);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      setResult(null);
      setErrorMsg("You're offline. Disease analysis requires an internet connection. Please reconnect and try again.");
      return;
    }
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const data = await api.analyzeDiseaseImage(selectedFile);
      setResult(data);
    } catch (err: any) {
      setResult(null);
      const isTimeout = err?.message?.toLowerCase().includes('timed out') || err?.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
        setErrorMsg('Pathology screening request timed out. Please try again.');
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setErrorMsg("You're offline. Disease analysis requires an internet connection. Please reconnect and try again.");
      } else {
        setErrorMsg(err.message || 'Image screening failed. Ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-2">
        <div className="flex items-center space-x-2 text-agri-700 font-bold text-xs uppercase tracking-wider">
          <Activity className="w-4 h-4" />
          <span>Plant Pathology Screening</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Crop Disease & Visual Pathology Screening
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Upload a clear photograph of affected crop foliage or lesions to screen for potential bacterial, fungal, or nutrient symptoms.
        </p>

        {/* Mandatory Disclaimer */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex items-start space-x-2.5 mt-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">AI-ASSISTED SCREENING — NOT LABORATORY DIAGNOSIS</strong>
            <span>
              This diagnostic aid provides visual pattern classification based on surface symptoms. It does not replace microscopic or culture laboratory assays conducted by agricultural university pathologists.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload & Image Preview Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Upload Plant Foliage Photograph</h3>
            {previewUrl && (
              <button
                onClick={clearSelection}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="border-2 border-dashed border-slate-200 hover:border-agri-500 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Upload crop image"
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Crop preview"
                  className="max-h-56 mx-auto rounded-lg object-contain shadow-sm border border-slate-200"
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
                <span className="text-xs text-agri-700 font-semibold block">Click to change image</span>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-slate-800">
                  Click or drag and drop crop photo here
                </div>
                <p className="text-[11px] text-slate-500">Supports JPG, PNG, WebP (Max 10MB)</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-700 block">Photography Best Practices:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Take close-up photos in natural morning daylight.</li>
              <li>Include both healthy leaf margin and diseased necrotic tissue.</li>
              <li>Avoid camera blur and intense sun glare.</li>
            </ul>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="w-full py-2.5 px-4 bg-agri-700 hover:bg-agri-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Screening Visual Pathology...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Screen Crop Image</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Screening Results Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Pathological Screening Output</h3>
            {result && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  result.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {result.status}
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <FileImage className="w-12 h-12 text-slate-300" />
              <div className="text-xs font-semibold text-slate-600">No Image Screened Yet</div>
              <p className="text-[11px] max-w-xs">
                Select and upload a crop foliage image on the left to view visual pathology screening findings.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3 animate-pulse">
              <Activity className="w-8 h-8 text-agri-600 animate-spin" />
              <div className="text-xs font-bold text-slate-800">Analyzing leaf venation and lesions...</div>
              <p className="text-[11px] text-slate-400">Verifying symptoms against agricultural pathology patterns.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Detected issue / AI unavailable */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Possible Issue / Syndrome
                </span>
                <div className="text-base font-black text-slate-900">{result.detected_issue}</div>
                {result.confidence_level && result.confidence_level !== 'None' && (
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    Confidence: <strong className="text-slate-800 font-semibold">{result.confidence_level}</strong>
                  </div>
                )}
              </div>

              {/* Visible symptoms */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 block uppercase text-[10px] text-slate-400">
                  Visible Symptoms
                </span>
                <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-100 leading-relaxed">
                  {result.visible_symptoms}
                </p>
              </div>

              {/* Suggested actions */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block uppercase text-[10px] text-slate-400">
                  Suggested Next Action
                </span>
                <ul className="space-y-1">
                  {result.suggested_actions.map((act, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-agri-600 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <strong className="text-slate-700">Limitations: </strong>
                <span>{result.limitations}</span>
              </div>

              {/* Mandatory label banner */}
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-2.5 rounded-lg text-[11px] font-bold text-center">
                {result.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

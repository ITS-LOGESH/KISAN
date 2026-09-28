import React from 'react';
import { RiskResult } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface RiskCardProps {
  risks: RiskResult[];
  loading?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risks, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />,
          label: 'HIGH RISK'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
          label: 'MODERATE RISK'
        };
      case 'LOW':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          label: 'LOW / SAFE'
        };
      case 'CANNOT_DETERMINE':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />,
          label: 'INSUFFICIENT DATA'
        };
    }
  };

  const formatRiskDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Deterministic Agricultural Risk Engine</span>
          </h3>
          <p className="text-xs text-slate-500">Transparent rule-based risk evaluation without arbitrary black-box scores</p>
        </div>
      </div>

      <div className="space-y-3">
        {risks.map((risk, idx) => {
          const badge = getLevelBadge(risk.level);
          const isCannotDetermine = risk.level === 'CANNOT_DETERMINE';

          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-slate-50/60 hover:bg-white transition-colors"
            >
              {/* Header: RISK Category + WHAT + STATUS Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    RISK: {risk.category.replace(/_/g, ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{risk.what_risk}</h4>
                </div>
                <div
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold border shrink-0 ${badge.bg}`}
                >
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* WHY / EVIDENCE */}
              <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-100">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  {isCannotDetermine ? 'REASON FOR STATUS:' : 'EVIDENCE:'}
                </span>
                {isCannotDetermine ? 'Insufficient data to determine risk. ' + risk.why_evidence : risk.why_evidence}
              </div>

              {/* Provenance: DATA USED, DATA DATE, LIMITATIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="font-semibold text-slate-700">DATA USED: </span>
                  <span>{risk.data_used}</span>
                  {risk.data_date && risk.data_date !== 'N/A' && (
                    <span className="text-slate-400 font-mono"> ({formatRiskDate(risk.data_date)})</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">LIMITATIONS: </span>
                  <span className="text-slate-600">{risk.limitations}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

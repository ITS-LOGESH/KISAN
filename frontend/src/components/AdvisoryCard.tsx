import React from 'react';
import { Advisory } from '../types';
import { CheckSquare, Droplet, Sparkles, Sprout, Info, AlertTriangle } from 'lucide-react';

interface AdvisoryCardProps {
  advisories: Advisory[];
  loading?: boolean;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({ advisories, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'IRRIGATION':
        return <Droplet className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'SPRAYING':
        return <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />;
      default:
        return <Sprout className="w-4 h-4 text-agri-600 shrink-0" />;
    }
  };

  if (advisories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
        No active advisories generated for this field state.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-agri-700" />
            <span>Actionable Decision-Support Advisories</span>
          </h3>
          <p className="text-xs text-slate-500">Transparent agronomic recommendations derived directly from telemetry</p>
        </div>
      </div>

      <div className="space-y-3">
        {advisories.map((advisory) => {
          const isFieldSpecific = advisory.category === 'IRRIGATION' || advisory.category === 'SPRAYING';

          return (
            <div
              key={advisory.id}
              className="border border-slate-200 rounded-lg p-4 space-y-2.5 bg-slate-50/50 hover:bg-white transition-colors"
            >
              {/* Header with Classification Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(advisory.category)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        AGRICULTURAL SIGNAL: {advisory.category}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          isFieldSpecific
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isFieldSpecific ? 'DATA-DRIVEN FIELD RECOMMENDATION' : 'GENERAL AGRONOMIC GUIDANCE'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{advisory.title}</h4>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${getPriorityBadge(
                    advisory.priority
                  )}`}
                >
                  {advisory.priority} Priority
                </span>
              </div>

              {/* Recommendation Body */}
              <div className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">RECOMMENDATION</span>
                <p>{advisory.recommendation}</p>
              </div>

              {/* Factors & Evidence */}
              {advisory.factors_used && advisory.factors_used.length > 0 && (
                <div className="text-xs bg-slate-100/70 p-2 rounded text-slate-700">
                  <span className="font-semibold text-slate-900">EVIDENCE / FACTORS USED: </span>
                  <span>{advisory.factors_used.join(' • ')}</span>
                </div>
              )}

              {/* Data Sources, Date, Limitations */}
              <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200/60">
                {advisory.data_sources && advisory.data_sources.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700">DATA SOURCE: </span>
                    <span>{advisory.data_sources.join(', ')}</span>
                  </div>
                )}
                {advisory.limitations && (
                  <div>
                    <span className="font-semibold text-slate-700">LIMITATIONS: </span>
                    <span className="text-slate-600">{advisory.limitations}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

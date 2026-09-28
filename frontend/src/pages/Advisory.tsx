import React, { useState, useEffect } from 'react';
import { Advisory as AdvisoryType, Field } from '../types';
import { api } from '../services/api';
import { CheckSquare, BookOpen, Droplet, Sparkles, Sprout, Wind, Sun, Filter, Layers, Clock } from 'lucide-react';

export const Advisory: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allAdvisories, setAllAdvisories] = useState<Array<AdvisoryType & { fieldName: string; cropType: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const fetchedFields = await api.getFields(true);
        setFields(fetchedFields);

        // Fetch advisories for all fields
        const advisoryPromises = fetchedFields.map(async (f) => {
          const advs = await api.getFieldAdvisories(f.id);
          return advs.map((a) => ({
            ...a,
            fieldName: f.name,
            cropType: f.crop_type
          }));
        });

        const nested = await Promise.all(advisoryPromises);
        const combined = nested.flat();
        setAllAdvisories(combined);
      } catch (err) {
        console.error('Failed to load advisories:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Filter advisories
  const filtered = allAdvisories.filter((a) => {
    if (selectedFieldId !== 'all' && a.field_id !== parseInt(selectedFieldId)) return false;
    if (selectedPriority !== 'all' && a.priority !== selectedPriority) return false;
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    return true;
  });

  const getPriorityStyle = (priority: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-2">
        <div className="flex items-center space-x-2 text-agri-700 font-bold text-xs uppercase tracking-wider">
          <CheckSquare className="w-4 h-4" />
          <span>Agricultural Decision Support</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Advisory Center & Transparent Decision Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Converting live meteorological and satellite telemetry into explainable agronomic recommendations across monitored fields.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-agri-700" />
          <span>Filter Advisories:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Field:</label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-slate-50 focus:ring-1 focus:ring-agri-600"
            >
              <option value="all">All Fields ({allAdvisories.length} total)</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Priority Level:</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-slate-50 focus:ring-1 focus:ring-agri-600"
            >
              <option value="all">All Priorities</option>
              <option value="HIGH">HIGH Priority</option>
              <option value="MEDIUM">MEDIUM Priority</option>
              <option value="LOW">LOW Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Category / Signal:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-slate-50 focus:ring-1 focus:ring-agri-600"
            >
              <option value="all">All Categories</option>
              <option value="IRRIGATION">IRRIGATION</option>
              <option value="SPRAYING">SPRAYING</option>
              <option value="MONITORING">MONITORING</option>
              <option value="FERTILIZATION">FERTILIZATION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advisory Timeline Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            Agricultural Intelligence Feed ({filtered.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            No advisories match your current filter settings.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-start sm:items-center space-x-2">
                    {getCategoryIcon(item.category)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.fieldName} ({item.cropType})
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          • {item.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{item.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase ${getPriorityStyle(
                        item.priority
                      )}`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs text-slate-800 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">ACTIONABLE RECOMMENDATION:</span>
                  {item.recommendation}
                </div>

                {item.factors_used && item.factors_used.length > 0 && (
                  <div className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-100">
                    <span className="font-semibold text-slate-900">EVIDENCE / REASON: </span>
                    <span>{item.factors_used.join(' • ')}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-3">
                    {item.data_sources && item.data_sources.length > 0 && (
                      <div>
                        <strong className="text-slate-700">Source: </strong>
                        <span>{item.data_sources.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-bold uppercase text-[10px]">
                    Status: Active Rule
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Rules Transparency Catalog */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-agri-700" />
          <h3 className="font-bold text-slate-900 text-base">
            Documented Weather → Agricultural Signal Rules
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          The exact deterministic agronomic logic executed by KrishiNet:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <Droplet className="w-4 h-4 text-blue-600" />
              <span>Rule 1: Quantitative Precipitation & Irrigation</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Condition:</strong> Precipitation probability ≥ 60% OR forecasted rainfall ≥ 15 mm over 48 hours.
            </p>
            <p className="text-slate-600">
              <strong>Action:</strong> Issue HIGH priority advisory to postpone canal and tube-well irrigation to avert waterlogging and nitrogen leaching.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <Wind className="w-4 h-4 text-teal-600" />
              <span>Rule 2: Wind Speed & Agrochemical Drift</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Condition:</strong> 10m Wind speed exceeds 15 km/h.
            </p>
            <p className="text-slate-600">
              <strong>Action:</strong> Issue HIGH priority advisory to suspend all chemical spraying to prevent off-target drift and chemical loss.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Rule 3: Thermal Stress & Canopy Cooling</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Condition:</strong> Air temperature exceeds physiological threshold (36°C for Wheat, 39°C for Paddy/Cotton).
            </p>
            <p className="text-slate-600">
              <strong>Action:</strong> Trigger Heat Stress Warning advising light afternoon micro-sprinkling and mulch retention.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
            <div className="flex items-center space-x-2 font-bold text-slate-900">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Rule 4: Soil Health Card Balancing</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Condition:</strong> Verified organic carbon &lt; 0.50% in farmer lab test.
            </p>
            <p className="text-slate-600">
              <strong>Action:</strong> Recommend 5-8 tonnes/ha farmyard manure (FYM) or bio-compost to rebuild cation exchange capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SoilData } from '../types';
import { DataSourceBadge } from './DataSourceBadge';
import { FlaskConical, AlertCircle, PlusCircle, Check, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface SoilCardProps {
  fieldId: number;
  soil: SoilData | null;
  onSoilUpdated?: () => void;
  loading?: boolean;
}

export const SoilCard: React.FC<SoilCardProps> = ({ fieldId, soil, onSoilUpdated, loading }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicCarbon: '',
    texture: 'Clay Loam',
    labName: 'Krishi Vigyan Kendra Soil Testing Lab'
  });
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const sourceType = soil?.source_type || 'UNAVAILABLE';
  const isUnavailable = sourceType === 'UNAVAILABLE';

  const getSourceBadgeStyle = (type: string) => {
    switch (type) {
      case 'MEASURED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'USER_PROVIDED':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'MODELLED':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'SATELLITE_DERIVED':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.recordFieldSoil(fieldId, {
        source_type: 'USER_PROVIDED',
        source_name: 'Farmer Soil Health Record',
        ph: formData.ph ? parseFloat(formData.ph) : null,
        nitrogen_kg_ha: formData.nitrogen ? parseFloat(formData.nitrogen) : null,
        phosphorus_kg_ha: formData.phosphorus ? parseFloat(formData.phosphorus) : null,
        potassium_kg_ha: formData.potassium ? parseFloat(formData.potassium) : null,
        organic_carbon_pct: formData.organicCarbon ? parseFloat(formData.organicCarbon) : null,
        texture: formData.texture,
        laboratory_name: formData.labName,
        test_date: new Date().toISOString()
      });
      setShowModal(false);
      if (onSoilUpdated) onSoilUpdated();
    } catch {
      alert('Error updating soil test record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-earth-700" />
            <span>Soil Intelligence & Chemical Profile</span>
          </h3>
          <p className="text-xs text-slate-500">Root zone nutrient and physicochemical parameters</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSourceBadgeStyle(
              sourceType
            )}`}
          >
            {sourceType.replace('_', ' ')}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-agri-700 hover:text-agri-800 flex items-center space-x-1 border border-agri-200 bg-agri-50 px-2.5 py-1 rounded hover:bg-agri-100 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Test</span>
          </button>
        </div>
      </div>

      {isUnavailable ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>SOIL DATA: Unavailable</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            No verified laboratory soil test or Soil Health Card is currently linked to this field. KrishiNet does not substitute environmental model estimates for laboratory measurements.
          </p>
          <div className="pt-1">
            <span className="text-[11px] text-slate-500">
              Click <strong>"Record Test"</strong> above to enter your lab report (pH, Nitrogen, Phosphorus, Potassium, Organic Carbon).
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Soil pH</div>
              <div className="text-2xl font-black text-slate-900 my-1">
                {soil?.ph !== null && soil?.ph !== undefined ? soil.ph.toFixed(1) : 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {soil?.ph && soil.ph >= 6.0 && soil.ph <= 7.5 ? 'Neutral (Optimal)' : 'Alkaline / Acidic'}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Available N (kg/ha)</div>
              <div className="text-2xl font-black text-slate-900 my-1">
                {soil?.nitrogen_kg_ha !== null && soil?.nitrogen_kg_ha !== undefined
                  ? `${soil.nitrogen_kg_ha}`
                  : 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Nitrogen status</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Available P (kg/ha)</div>
              <div className="text-2xl font-black text-slate-900 my-1">
                {soil?.phosphorus_kg_ha !== null && soil?.phosphorus_kg_ha !== undefined
                  ? `${soil.phosphorus_kg_ha}`
                  : 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Phosphorus status</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Available K (kg/ha)</div>
              <div className="text-2xl font-black text-slate-900 my-1">
                {soil?.potassium_kg_ha !== null && soil?.potassium_kg_ha !== undefined
                  ? `${soil.potassium_kg_ha}`
                  : 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Potassium status</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400">Organic Carbon: </span>
              <strong className="text-slate-900 font-mono">
                {soil?.organic_carbon_pct !== null && soil?.organic_carbon_pct !== undefined
                  ? `${soil.organic_carbon_pct}%`
                  : 'Unavailable'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Soil Texture: </span>
              <strong className="text-slate-900">{soil?.texture || 'Unavailable'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Lab Source: </span>
              <strong className="text-slate-900">{soil?.laboratory_name || soil?.source_name || 'User Logged'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Data Provenance Badge */}
      <DataSourceBadge
        source={soil?.source_name || (isUnavailable ? 'None on record' : 'Farmer Soil Record')}
        dataType={`Soil Record (${sourceType})`}
        retrievedAt={soil?.created_at || soil?.test_date}
        status={isUnavailable ? 'UNAVAILABLE' : 'AVAILABLE'}
      />

      {/* Modal to record real soil test */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Record Verified Soil Test</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Laboratory / KVK Name</label>
                <input
                  type="text"
                  required
                  value={formData.labName}
                  onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                  className="w-full border rounded p-2 text-xs focus:ring-1 focus:ring-agri-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 6.5"
                    value={formData.ph}
                    onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                    className="w-full border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Organic Carbon (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.55"
                    value={formData.organicCarbon}
                    onChange={(e) => setFormData({ ...formData, organicCarbon: e.target.value })}
                    className="w-full border rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">N (kg/ha)</label>
                  <input
                    type="number"
                    placeholder="e.g. 210"
                    value={formData.nitrogen}
                    onChange={(e) => setFormData({ ...formData, nitrogen: e.target.value })}
                    className="w-full border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">P (kg/ha)</label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    value={formData.phosphorus}
                    onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                    className="w-full border rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">K (kg/ha)</label>
                  <input
                    type="number"
                    placeholder="e.g. 280"
                    value={formData.potassium}
                    onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                    className="w-full border rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Soil Texture</label>
                <select
                  value={formData.texture}
                  onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                  className="w-full border rounded p-2 text-xs"
                >
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Black Soil (Regur)">Black Soil (Regur)</option>
                  <option value="Alluvial Silt">Alluvial Silt</option>
                  <option value="Red Sandy Soil">Red Sandy Soil</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-agri-700 hover:bg-agri-800 text-white font-medium rounded flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Soil Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

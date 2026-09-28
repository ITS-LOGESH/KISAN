import React, { useState } from 'react';
import { api } from '../services/api';
import { X, FlaskConical, Check, UploadCloud } from 'lucide-react';

interface SoilUploadModalProps {
  fieldId: number;
  fieldName: string;
  isOpen: boolean;
  onClose: () => void;
  onSoilSaved: () => void;
}

export const SoilUploadModal: React.FC<SoilUploadModalProps> = ({
  fieldId,
  fieldName,
  isOpen,
  onClose,
  onSoilSaved
}) => {
  const [formData, setFormData] = useState({
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicCarbon: '',
    texture: 'Clay Loam',
    labName: 'Krishi Vigyan Kendra (KVK) Soil Testing Lab'
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

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
      onSoilSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save soil report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-canvas-border animate-fade-in text-soil-950">
        <div className="flex items-center justify-between border-b border-canvas-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-harvest-50 border border-harvest-200 flex items-center justify-center text-harvest-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-soil-950">Add Soil Test Parameters</h3>
              <p className="text-xs text-soil-500 font-mono">For {fieldName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-canvas-100 rounded-full text-soil-400 hover:text-soil-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Testing Lab or KVK Authority</label>
            <input
              type="text"
              required
              value={formData.labName}
              onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
              className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Soil pH (e.g. 6.8)</label>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="11.0"
                required
                placeholder="6.5"
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Soil Texture</label>
              <select
                value={formData.texture}
                onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
              >
                <option value="Clay Loam">Clay Loam</option>
                <option value="Alluvial Loam">Alluvial Loam</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Black Cotton Soil">Black Cotton Soil</option>
                <option value="Red Laterite">Red Laterite</option>
                <option value="Silty Clay">Silty Clay</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Available N (kg/ha)</label>
              <input
                type="number"
                step="1"
                placeholder="240"
                value={formData.nitrogen}
                onChange={(e) => setFormData({ ...formData, nitrogen: e.target.value })}
                className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Available P (kg/ha)</label>
              <input
                type="number"
                step="1"
                placeholder="18"
                value={formData.phosphorus}
                onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Available K (kg/ha)</label>
              <input
                type="number"
                step="1"
                placeholder="195"
                value={formData.potassium}
                onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1C1510] font-bold uppercase tracking-wider text-[10px] mb-1.5">Organic Carbon % (Optional)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.65"
              value={formData.organicCarbon}
              onChange={(e) => setFormData({ ...formData, organicCarbon: e.target.value })}
              className="w-full border border-[#D5C2AD] rounded-xl p-3 text-xs bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#E8E2D8] text-[#5C4535] hover:text-[#1C1510] hover:bg-[#FAF8F4] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#1B4D3E] hover:bg-[#153D31] text-white font-semibold transition-all shadow-subtle flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Soil Parameters</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

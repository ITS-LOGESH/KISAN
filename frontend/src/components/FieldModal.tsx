import React, { useState, useEffect } from 'react';
import { Field } from '../types';
import { api } from '../services/api';
import { X, MapPin, Sprout, Calendar, Layers, Check, AlertCircle } from 'lucide-react';

interface FieldModalProps {
  isOpen: boolean;
  fieldToEdit: Field | null;
  onClose: () => void;
  onFieldSaved: (savedField: Field) => void;
}

const COMMON_CROPS = [
  'Rice (Paddy)',
  'Wheat',
  'Cotton',
  'Millet (Pearl/Finger)',
  'Maize',
  'Groundnut',
  'Mustard',
  'Pulses (Gram/Tur)'
];

const PRESET_LOCATIONS = [
  { name: 'Cauvery Delta, Tamil Nadu', lat: 10.7870, lon: 79.1378, state: 'Tamil Nadu', district: 'Thanjavur' },
  { name: 'Kaveri Basin, Karnataka', lat: 12.5218, lon: 76.8951, state: 'Karnataka', district: 'Mandya' },
  { name: 'Malwa Belt, Punjab', lat: 30.9010, lon: 75.8573, state: 'Punjab', district: 'Ludhiana' },
  { name: 'Godavari Basin, Maharashtra', lat: 19.9975, lon: 73.7898, state: 'Maharashtra', district: 'Nashik' },
];

export const FieldModal: React.FC<FieldModalProps> = ({
  isOpen,
  fieldToEdit,
  onClose,
  onFieldSaved
}) => {
  const [name, setName] = useState<string>('');
  const [cropType, setCropType] = useState<string>('Rice (Paddy)');
  const [state, setState] = useState<string>('Tamil Nadu');
  const [district, setDistrict] = useState<string>('Thanjavur');
  const [lat, setLat] = useState<string>('10.7870');
  const [lon, setLon] = useState<string>('79.1378');
  const [area, setArea] = useState<string>('3.5');
  const [sowingDate, setSowingDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (fieldToEdit) {
      setName(fieldToEdit.name);
      setCropType(fieldToEdit.crop_type);
      setState(fieldToEdit.state);
      setDistrict(fieldToEdit.district || '');
      setLat(fieldToEdit.latitude.toString());
      setLon(fieldToEdit.longitude.toString());
      setArea((fieldToEdit.area_acres || 3.0).toString());
      setSowingDate(fieldToEdit.sowing_date ? fieldToEdit.sowing_date.split('T')[0] : '');
    } else {
      setName('');
      setCropType('Rice (Paddy)');
      setState('Tamil Nadu');
      setDistrict('Thanjavur');
      setLat('10.7870');
      setLon('79.1378');
      setArea('3.5');
      setSowingDate(new Date().toISOString().split('T')[0]);
    }
    setErrorMsg(null);
  }, [fieldToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setLat(preset.lat.toFixed(4));
    setLon(preset.lon.toFixed(4));
    setState(preset.state);
    setDistrict(preset.district);
    if (!name) setName(`${preset.district} Farm`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    const parsedArea = parseFloat(area);

    if (!name.trim()) {
      setErrorMsg('Please enter a farm name.');
      return;
    }

    if (isNaN(parsedLat) || parsedLat < 6 || parsedLat > 38) {
      setErrorMsg('Please enter a valid latitude within India (6°N to 38°N).');
      return;
    }

    if (isNaN(parsedLon) || parsedLon < 68 || parsedLon > 98) {
      setErrorMsg('Please enter a valid longitude within India (68°E to 98°E).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Field> = {
        name: name.trim(),
        crop_type: cropType,
        state: state.trim() || 'India',
        district: district.trim() || undefined,
        latitude: parsedLat,
        longitude: parsedLon,
        area_acres: isNaN(parsedArea) ? 3.0 : parsedArea,
        sowing_date: sowingDate ? new Date(sowingDate).toISOString() : undefined,
      };

      let result: Field;
      if (fieldToEdit) {
        result = await api.updateField(fieldToEdit.id, payload);
      } else {
        result = await api.createField(payload);
      }

      onFieldSaved(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save farm parcel. Max 4 farms allowed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soil-950/70 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl border border-canvas-border shadow-floating w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-canvas-border flex items-center justify-between bg-canvas-50">
          <div>
            <h3 className="font-serif font-bold text-soil-950 text-xl">
              {fieldToEdit ? 'Edit Farm Parcel' : 'Register New Farm Parcel'}
            </h3>
            <p className="text-xs text-soil-500">
              Manage up to 4 registered agricultural parcels per farmer profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-soil-400 hover:text-soil-800 rounded-xl hover:bg-canvas-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Location Presets for fast entry */}
          {!fieldToEdit && (
            <div className="space-y-1.5 pb-2">
              <span className="text-[11px] font-mono text-soil-500 font-bold uppercase">
                Quick Regional Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LOCATIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="px-2.5 py-1 rounded-lg border border-canvas-border bg-canvas-100 hover:bg-moss-50 text-soil-700 text-[11px] transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-soil-800 mb-1">Farm Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cauvery Paddy Land"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-soil-800 mb-1">Crop Type</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none cursor-pointer"
              >
                {COMMON_CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-soil-800 mb-1">Area (Acres)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="500"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="3.5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-soil-800 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Tamil Nadu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-soil-800 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Thanjavur"
                className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-soil-800 mb-1">Latitude (°N)</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="10.7870"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-soil-800 mb-1">Longitude (°E)</label>
              <input
                type="text"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="79.1378"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-soil-800 mb-1">Sowing Date</label>
            <input
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-canvas-border bg-canvas-50 focus:bg-white focus:border-moss-600 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-canvas-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-canvas-border text-soil-700 hover:bg-canvas-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-moss-700 hover:bg-moss-800 text-white font-bold shadow-subtle flex items-center space-x-2"
            >
              {submitting ? (
                <span>Saving Farm...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{fieldToEdit ? 'Save Changes' : 'Register Farm'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

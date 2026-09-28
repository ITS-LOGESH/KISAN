import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { UserProfile, Field } from '../types';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { StatusBadge } from '../design-system/StatusBadge';
import { ArrowLeft, User, Globe, Phone, MapPin, Check, Layers, Sparkles } from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { language, setLanguage, tamilDialect, setTamilDialect, supportedLanguages, t } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getUserProfile().catch(() => null),
      api.getFields(true).catch(() => []),
    ]).then(([p, fList]) => {
      if (p) {
        setProfile(p);
        setName(p.name || 'Farmer');
        setPhone(p.phone || '');
        setState(p.state || 'Tamil Nadu');
      }
      setFields(fList);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateUserProfile({
        name,
        phone,
        state,
        preferred_language: language,
        tamil_dialect: tamilDialect,
      });
      setProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const totalArea = fields.reduce((acc, f) => acc + (f.area_acres || 0), 0);

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
        <button
          onClick={() => navigate('home')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4535] hover:text-[#1C1510] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToHome', 'Back to Home')}</span>
        </button>

        <span className="font-mono text-xs text-[#786C60]">
          {t('profile', 'Profile Settings')}
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-black text-[#1C1510] tracking-tight">
          {t('farmerProfile', 'Farmer Profile')}
        </h1>
        <p className="text-sm text-[#6B5E51] font-light">
          {t('profileDesc', 'Manage your personal details, farm location, and vernacular language preferences.')}
        </p>
      </div>

      {/* Farm Holdings Summary */}
      <Card variant="surface" className="flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F5F0] text-[#1B4D3E] flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-[#786C60] block">
              {t('registeredHoldings', 'REGISTERED LAND HOLDINGS')}
            </span>
            <strong className="font-serif font-bold text-lg text-[#1C1510]">
              {fields.length} {t('parcels', 'Parcels')} ({totalArea.toFixed(1)} {t('acres', 'acres')})
            </strong>
          </div>
        </div>

        <button
          onClick={() => navigate('fields')}
          className="text-xs font-semibold text-[#1B4D3E] hover:underline cursor-pointer"
        >
          {t('allFieldsCount', 'Manage Fields')} →
        </button>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-subtle">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
          <div className="flex items-center space-x-2.5">
            <User className="w-5 h-5 text-[#1B4D3E]" />
            <h2 className="font-serif font-bold text-lg text-[#1C1510]">
              {t('step1Title', 'Farmer Details & Dialect')}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#786C60] uppercase">
            {t('openDataBadge', '₹0 OPEN DATA')}
          </span>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{t('profileUpdated', 'Profile and language preferences successfully updated.')}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[#1C1510] font-semibold mb-1">
              {t('fullNameLabel', 'Farmer Full Name *')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#D5C2AD] rounded-2xl p-3 text-sm bg-white text-[#1C1510] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[#1C1510] font-semibold mb-1">
              {t('mobileLabel', 'Mobile Phone Number')}
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[#D5C2AD] rounded-2xl p-3 text-sm bg-white text-[#1C1510] placeholder-[#786C60] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
            />
            <span className="text-[11px] text-[#786C60] mt-1 block">
              {t('mobileHelp', 'Used for SMS crop alerts and regional weather warnings.')}
            </span>
          </div>

          <div>
            <label className="block text-[#1C1510] font-semibold mb-1">
              {t('step2Title', 'State of Cultivation')}
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-[#D5C2AD] rounded-2xl p-3 text-sm bg-white text-[#1C1510] focus:ring-2 focus:ring-[#1B4D3E] outline-none transition-all"
            />
          </div>

          {/* Language Selection */}
          <div className="pt-2">
            <label className="block text-[#1C1510] font-semibold mb-2">
              {t('chooseLanguage', 'Preferred Application Language')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {supportedLanguages.map((l) => (
                <button
                  type="button"
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    language === l.code
                      ? 'bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-subtle'
                      : 'bg-[#FAF8F4] text-[#1C1510] border-[#E8E2D8] hover:bg-white'
                  }`}
                >
                  <strong className="block text-sm leading-tight">{l.nativeName}</strong>
                  <span className={`text-[10px] block mt-0.5 ${language === l.code ? 'text-emerald-200' : 'text-[#786C60]'}`}>
                    {l.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamil Dialect Toggle if Tamil is selected */}
          {language === 'ta' && (
            <div className="p-4 rounded-2xl bg-[#E8F5F0] border border-[#BEE9DC] space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#1B4D3E] block">
                {t('tamilDialectTitle', 'தமிழ் நடை (Tamil Style)')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTamilDialect('natural')}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    tamilDialect === 'natural'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'bg-white text-[#1C1510] border border-[#E8E2D8]'
                  }`}
                >
                  {t('tamilNaturalDesc', 'இயல்பான பேச்சு')}
                </button>
                <button
                  type="button"
                  onClick={() => setTamilDialect('standard')}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    tamilDialect === 'standard'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'bg-white text-[#1C1510] border border-[#E8E2D8]'
                  }`}
                >
                  {t('tamilStandardDesc', 'செந்தமிழ்')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            className="cursor-pointer"
          >
            {t('saveChanges', 'Save Profile')}
          </Button>
        </div>
      </form>
    </div>
  );
};

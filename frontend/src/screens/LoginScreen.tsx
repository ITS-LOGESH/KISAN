import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Button } from '../design-system/Button';
import { SupportedLanguage, TamilDialect } from '../utils/i18n';
import { Sprout, ArrowRight, ShieldCheck, Phone, User, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { language, setLanguage, tamilDialect, setTamilDialect, supportedLanguages, t } = useLanguage();

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing profile if any
  useEffect(() => {
    api.getUserProfile().then((p) => {
      if (p) {
        if (p.name && p.name !== 'Farmer') setName(p.name);
        if (p.phone) setPhone(p.phone);
        if (p.preferred_language) setLanguage(p.preferred_language as SupportedLanguage);
        if (p.tamil_dialect) setTamilDialect(p.tamil_dialect as TamilDialect);
      }
    }).catch(() => {});
  }, [setLanguage, setTamilDialect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Update profile in backend
      await api.updateUserProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        preferred_language: language,
        tamil_dialect: language === 'ta' ? tamilDialect : undefined,
      });

      // Move directly into the guided onboarding flow
      navigate('onboarding');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setErrorMsg(err.message || 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-between selection:bg-[#BEE9DC] selection:text-[#0F2F26] p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('welcome')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C4535] hover:text-[#1C1510] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToWelcome', 'Back to Welcome')}</span>
        </button>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E8F5F0] border border-[#BEE9DC] text-[11px] font-mono font-semibold text-[#1B4D3E]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
          <span>{t('openDataBadge', '₹0 Free Open Data')}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-10 shadow-elevated space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4D3E] flex items-center justify-center text-white shadow-subtle mb-3">
              <Sprout className="w-6 h-6 text-[#FBDD97]" />
            </div>

            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1B4D3E] block">
              {t('step1Of2', 'STEP 1 OF 2 • FARMER REGISTRATION')}
            </span>

            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1510] tracking-tight">
              {t('welcomeToKisan', 'Welcome to Kisan')}
            </h1>

            <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
              {t('loginSubtitle', 'Enter your name and mobile number. Then we will map your actual land boundary and start live agricultural telemetry.')}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-1.5">
                {t('fullNameLabel', 'Farmer Full Name *')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('fullNamePlaceholder', 'e.g. Murugan, Ramesh Kumar, Harpreet Singh')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                />
                <User className="w-4 h-4 text-[#786C60] absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-1.5">
                {t('mobileLabel', 'Mobile Phone Number')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                />
                <Phone className="w-4 h-4 text-[#786C60] absolute left-3.5 top-3.5" />
              </div>
              <span className="text-[11px] text-[#786C60] mt-1 block">
                {t('mobileHelp', 'Used for SMS crop alerts and regional weather warnings.')}
              </span>
            </div>

            {/* Preferred Language */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                {t('chooseLanguage', 'Choose Spoken Language')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {supportedLanguages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1B4D3E] bg-[#E8F5F0] ring-1 ring-[#1B4D3E]'
                          : 'border-[#E8E2D8] hover:border-[#D5C2AD] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1510]">
                          {lang.nativeName}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4D3E]" />}
                      </div>
                      <span className="text-[10px] text-[#5C4535] block truncate mt-0.5">
                        {lang.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tamil Dialect if Tamil is selected */}
            {language === 'ta' && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C78520]" />
                  <span className="font-bold text-[#1C1510]">{t('tamilDialectTitle', 'தமிழ் உரை நடை (Tamil Dialect)')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTamilDialect('natural')}
                    className={`p-2 rounded-lg border text-left cursor-pointer ${
                      tamilDialect === 'natural'
                        ? 'border-[#1B4D3E] bg-[#E8F5F0] text-[#1B4D3E] font-bold'
                        : 'border-[#D5C2AD] bg-white text-[#1C1510]'
                    }`}
                  >
                    {t('tamilNaturalDesc', 'இயல்பான பேச்சு நடை')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamilDialect('standard')}
                    className={`p-2 rounded-lg border text-left cursor-pointer ${
                      tamilDialect === 'standard'
                        ? 'border-[#1B4D3E] bg-[#E8F5F0] text-[#1B4D3E] font-bold'
                        : 'border-[#D5C2AD] bg-white text-[#1C1510]'
                    }`}
                  >
                    {t('tamilStandardDesc', 'செந்தமிழ் நடை')}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="w-full shadow-elevated cursor-pointer"
              >
                {t('continueToFarm', 'Continue to Farm Boundary →')}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center text-xs font-mono text-[#8C6B4E]">
        Kisan Open Agricultural Platform • No Credit Card Required
      </footer>
    </div>
  );
};

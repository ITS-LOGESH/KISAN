import React, { useState, useEffect, useRef } from 'react';
import { Sprout, Layers, Microscope, Sparkles, Plus, Globe, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { SupportedLanguage, TamilDialect, SUPPORTED_LANGUAGES } from '../utils/i18n';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onAddFieldClick: () => void;
  language?: SupportedLanguage;
  tamilDialect?: TamilDialect;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onTamilDialectChange?: (dialect: TamilDialect) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  demoMode,
  onToggleDemoMode,
  onAddFieldClick,
  language = 'en',
  tamilDialect = 'standard',
  onLanguageChange,
  onTamilDialectChange
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home', target: '#top' },
    { id: 'my-fields', label: 'My Fields', target: '#your-land' },
    { id: 'check-crop', label: 'Check Crop', target: '#check-crop' },
    { id: 'ask-field', label: 'Ask My Field', target: '#ask-field-section' },
  ];

  const handleNavClick = (target: string) => {
    if (currentTab !== 'dashboard') {
      onTabChange('dashboard');
      setTimeout(() => {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentLangLabel = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName || 'Language';

  return (
    <>
      {/* Desktop / Tablet Sticky Top Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 select-none ${
          isScrolled
            ? 'bg-[#FAF8F4]/95 backdrop-blur-md border-b border-canvas-border shadow-subtle py-3 text-soil-950'
            : 'bg-transparent py-5 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavClick('#top')}
            role="button"
            tabIndex={0}
            aria-label="KrishiNet Home"
          >
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors shadow-subtle ${
                isScrolled
                  ? 'bg-moss-800 text-white'
                  : 'bg-white/20 backdrop-blur-md border border-white/30 text-white'
              }`}
            >
              <Sprout className="w-5 h-5 text-harvest-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black text-xl tracking-tight leading-none">
                  KRISHINET
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isScrolled
                      ? 'bg-moss-50 text-moss-800 border border-moss-200'
                      : 'bg-white/20 text-white/90 border border-white/30'
                  }`}
                >
                  ₹0 OPEN DATA
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.target)}
                className={`px-4 py-2 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
                  isScrolled
                    ? 'text-soil-700 hover:text-soil-950 hover:bg-canvas-200'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Controls: Language, Demo Switch & Add Field */}
          <div className="flex items-center space-x-3">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  isScrolled
                    ? 'bg-canvas-100 border-canvas-border text-soil-800 hover:bg-canvas-200'
                    : 'bg-black/30 backdrop-blur-md border-white/25 text-white hover:bg-black/40'
                }`}
                title="Change language"
              >
                <Globe className="w-3.5 h-3.5 text-harvest-400" />
                <span className="font-semibold">{currentLangLabel}</span>
                {language === 'ta' && (
                  <span className="text-[10px] opacity-80 hidden lg:inline">
                    ({tamilDialect === 'natural' ? 'பேச்சு' : 'செந்தமிழ்'})
                  </span>
                )}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Language Menu */}
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-canvas-border rounded-2xl shadow-xl p-2 z-50 divide-y divide-canvas-border text-soil-900 animate-fade-in">
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-soil-400 font-semibold block px-2">
                      Select Language
                    </span>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          if (onLanguageChange) onLanguageChange(l.code);
                          if (l.code !== 'ta') setShowLangMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          language === l.code
                            ? 'bg-moss-50 text-moss-900 font-bold'
                            : 'hover:bg-canvas-100 text-soil-800'
                        }`}
                      >
                        <span>{l.nativeName}</span>
                        <span className="text-[11px] text-soil-400">{l.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* If Tamil is selected, offer dialect/style toggle */}
                  {language === 'ta' && (
                    <div className="p-2 space-y-1 bg-moss-50/50 rounded-b-xl">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block px-2">
                        தமிழ் நடை (Dialect)
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onTamilDialectChange) onTamilDialectChange('natural');
                            setShowLangMenu(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            tamilDialect === 'natural'
                              ? 'bg-moss-700 text-white shadow-sm'
                              : 'bg-white border border-canvas-border text-soil-700 hover:bg-canvas-100'
                          }`}
                        >
                          இயல்பான பேச்சு
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onTamilDialectChange) onTamilDialectChange('standard');
                            setShowLangMenu(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            tamilDialect === 'standard'
                              ? 'bg-moss-700 text-white shadow-sm'
                              : 'bg-white border border-canvas-border text-soil-700 hover:bg-canvas-100'
                          }`}
                        >
                          செந்தமிழ்
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Demo Toggle */}
            <div
              className={`hidden sm:flex items-center space-x-2 p-1 px-2.5 rounded-full text-xs font-mono transition-colors ${
                isScrolled
                  ? 'bg-canvas-100 border border-canvas-border text-soil-600'
                  : 'bg-black/30 backdrop-blur-md border border-white/20 text-white/80'
              }`}
            >
              <span className="text-[10px] uppercase">Demo</span>
              <button
                onClick={onToggleDemoMode}
                className={`relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
                  demoMode ? 'bg-moss-600' : 'bg-soil-400'
                }`}
                role="switch"
                aria-checked={demoMode}
                aria-label="Toggle Demo Farms"
              >
                <span
                  className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                    demoMode ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Add Field Button */}
            <button
              onClick={onAddFieldClick}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full font-sans text-xs font-semibold transition-all shadow-subtle cursor-pointer ${
                isScrolled
                  ? 'bg-moss-800 hover:bg-moss-900 text-white'
                  : 'bg-white hover:bg-harvest-200 text-soil-950'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-lg border-t border-canvas-border px-4 py-2 flex items-center justify-around shadow-floating">
        <button
          onClick={() => handleNavClick('#top')}
          className="flex flex-col items-center p-1.5 rounded-lg text-[10px] font-semibold text-soil-700 hover:text-moss-800 transition-colors"
        >
          <Sprout className="w-5 h-5 mb-0.5 text-moss-800" />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleNavClick('#your-land')}
          className="flex flex-col items-center p-1.5 rounded-lg text-[10px] font-semibold text-soil-600 hover:text-moss-800 transition-colors"
        >
          <Layers className="w-5 h-5 mb-0.5 text-soil-700" />
          <span>My Fields</span>
        </button>

        <button
          onClick={() => handleNavClick('#check-crop')}
          className="flex flex-col items-center p-1.5 rounded-lg text-[10px] font-semibold text-soil-600 hover:text-moss-800 transition-colors"
        >
          <Microscope className="w-5 h-5 mb-0.5 text-soil-700" />
          <span>Check Crop</span>
        </button>

        <button
          onClick={() => handleNavClick('#ask-field-section')}
          className="flex flex-col items-center p-1.5 rounded-lg text-[10px] font-semibold text-soil-600 hover:text-moss-800 transition-colors"
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-harvest-600" />
          <span>Ask Field</span>
        </button>
      </nav>
    </>
  );
};

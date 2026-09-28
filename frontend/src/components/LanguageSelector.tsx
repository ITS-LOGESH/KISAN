import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'pill' | 'compact' | 'inline';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'pill',
  className = '',
}) => {
  const { language, setLanguage, tamilDialect, setTamilDialect, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentOption = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-1.5 rounded-full border transition-all cursor-pointer font-sans select-none ${
          variant === 'compact'
            ? 'px-2.5 py-1 text-xs bg-white/90 hover:bg-white border-[#E8E2D8] text-[#1C1510] shadow-sm'
            : 'px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F7F4EE] border-[#D5C2AD] text-[#1C1510] shadow-subtle hover:border-[#1B4D3E]'
        }`}
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[#1B4D3E] shrink-0" />
        <span className="font-semibold text-xs text-[#1C1510]">
          {currentOption.nativeName}
        </span>
        <ChevronDown className={`w-3 h-3 text-[#786C60] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E8E2D8] shadow-floating z-50 p-2 text-xs space-y-2 animate-scale-up">
          <div className="px-3 py-1.5 border-b border-[#E8E2D8] flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#786C60]">
              {t('chooseLanguage', 'Choose Spoken Language')}
            </span>
            <span className="text-[10px] font-mono text-[#1B4D3E] font-semibold">
              8 Languages
            </span>
          </div>

          {/* Grid of Languages */}
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto p-1">
            {supportedLanguages.map((opt) => {
              const isSelected = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    setLanguage(opt.code);
                    if (opt.code !== 'ta') {
                      setIsOpen(false);
                    }
                  }}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#E8F5F0] border border-[#1B4D3E] text-[#1B4D3E] font-bold shadow-xs'
                      : 'hover:bg-[#FAF8F4] border border-transparent text-[#1C1510]'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <span className="block text-xs truncate font-medium">
                      {opt.nativeName}
                    </span>
                    <span className="block text-[10px] text-[#786C60] truncate">
                      {opt.name}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#1B4D3E] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Tamil Dialect Section if Tamil is active */}
          {language === 'ta' && (
            <div className="pt-2 border-t border-[#E8E2D8] px-2 pb-1 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#1C1510]">
                <Sparkles className="w-3 h-3 text-[#C78520]" />
                <span>{t('tamilDialectTitle', 'தமிழ் உரை நடை')}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setTamilDialect('natural');
                    setIsOpen(false);
                  }}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    tamilDialect === 'natural'
                      ? 'bg-[#E8F5F0] border-[#1B4D3E] text-[#1B4D3E] font-bold'
                      : 'bg-white border-[#E8E2D8] text-[#5C4535] hover:bg-[#FAF8F4]'
                  }`}
                >
                  பேச்சுத்தமிழ்
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTamilDialect('standard');
                    setIsOpen(false);
                  }}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                    tamilDialect === 'standard'
                      ? 'bg-[#E8F5F0] border-[#1B4D3E] text-[#1B4D3E] font-bold'
                      : 'bg-white border-[#E8E2D8] text-[#5C4535] hover:bg-[#FAF8F4]'
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
  );
};

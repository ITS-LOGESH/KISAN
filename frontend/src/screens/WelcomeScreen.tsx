import React from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { Button } from '../design-system/Button';
import { Sprout, ArrowRight, ShieldCheck } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { navigate } = useRouter();
  const { t } = useLanguage();

  const handleGetStarted = () => {
    const isOnboarded = localStorage.getItem('kisan_onboarded') === 'true';
    if (isOnboarded) {
      navigate('home');
    } else {
      navigate('login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-between selection:bg-[#BEE9DC] selection:text-[#0F2F26] overflow-x-hidden">
      {/* Top Subtle Brand Bar */}
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#1B4D3E] flex items-center justify-center text-white shadow-subtle">
            <Sprout className="w-5 h-5 text-[#FBDD97]" />
          </div>
          <span className="font-serif font-black text-2xl tracking-tight text-[#1C1510]">
            {t('appTitle', 'KISAN')}
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <LanguageSelector variant="compact" />

          <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E8F5F0] border border-[#BEE9DC] text-[11px] font-mono font-semibold text-[#1B4D3E]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
            <span>{t('openDataBadge', '₹0 Open Data')}</span>
          </div>

          <button
            onClick={() => navigate('login')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1B4D3E] hover:bg-[#E8F5F0] border border-[#BEE9DC] transition-colors cursor-pointer"
          >
            {t('signInRegister', 'Sign In / Register')}
          </button>
        </div>
      </div>

      {/* Main Content Area: Responsive Desktop Two-Column / Mobile Stack */}
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 sm:py-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* ================= PURPOSE-BUILT ELEVATED FIELD VISUAL (Blends into #FAF8F4 canvas) ================= */}
          <div className="lg:col-span-6 lg:order-2">
            <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center select-none">
              {/* Soft atmospheric canvas-matching ground aura */}
              <div className="absolute inset-0 bg-radial from-[#1B4D3E]/10 via-[#FBDD97]/10 to-transparent rounded-full filter blur-3xl transform scale-110 pointer-events-none" />

              {/* Seamless SVG Elevated Field Cadastral Visual */}
              <svg
                className="w-full h-full p-2 filter drop-shadow-xl"
                viewBox="0 0 460 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Subtle furrows/crop rows pattern */}
                  <pattern
                    id="welcome-crop-rows"
                    width="14"
                    height="14"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(28)"
                  >
                    <line x1="0" y1="0" x2="0" y2="14" stroke="#349377" strokeWidth="1.6" strokeOpacity="0.45" />
                  </pattern>

                  {/* Surface gradient: living arable parcel */}
                  <linearGradient id="fieldSurface" x1="60" y1="70" x2="380" y2="310" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#25745E" />
                    <stop offset="60%" stopColor="#1B4D3E" />
                    <stop offset="100%" stopColor="#133E31" />
                  </linearGradient>

                  {/* Extruded parcel subsoil depth */}
                  <linearGradient id="fieldSoilDepth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8C6B4E" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#443327" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* Subtle Cadastral Grid lines in background */}
                <g stroke="#D5C2AD" strokeWidth="1" strokeDasharray="3 4" opacity="0.6">
                  <line x1="40" y1="90" x2="420" y2="90" />
                  <line x1="40" y1="190" x2="420" y2="190" />
                  <line x1="40" y1="290" x2="420" y2="290" />
                  <line x1="120" y1="40" x2="120" y2="360" />
                  <line x1="230" y1="40" x2="230" y2="360" />
                  <line x1="340" y1="40" x2="340" y2="360" />
                </g>

                {/* Isometric Extrusion/Ground Depth under the Parcel */}
                <polygon
                  points="70,160 70,178 190,328 390,268 390,250 190,310"
                  fill="url(#fieldSoilDepth)"
                  opacity="0.85"
                />

                {/* Main Cadastral Parcel Polygon (Elevated 2.5D perspective) */}
                {/* Vertices: A(140, 80), B(350, 95), C(390, 250), D(190, 310), E(70, 160) */}
                <polygon
                  points="140,80 350,95 390,250 190,310 70,160"
                  fill="url(#fieldSurface)"
                />

                {/* Internal Crop Rows Texture following the parcel boundary */}
                <polygon
                  points="140,80 350,95 390,250 190,310 70,160"
                  fill="url(#welcome-crop-rows)"
                />

                {/* Cadastral Boundary Perimeter Stroke */}
                <polygon
                  points="140,80 350,95 390,250 190,310 70,160"
                  stroke="#C78520"
                  strokeWidth="2.5"
                  strokeDasharray="7 4"
                  strokeLinejoin="round"
                />

                {/* Vertex Survey Pins & Boundary Nodes */}
                <g>
                  {/* Vertex A */}
                  <circle cx="140" cy="80" r="4.5" fill="#FFFFFF" stroke="#C78520" strokeWidth="2" />
                  {/* Vertex B */}
                  <circle cx="350" cy="95" r="4.5" fill="#FFFFFF" stroke="#C78520" strokeWidth="2" />
                  {/* Vertex C */}
                  <circle cx="390" cy="250" r="4.5" fill="#FFFFFF" stroke="#C78520" strokeWidth="2" />
                  {/* Vertex D */}
                  <circle cx="190" cy="310" r="4.5" fill="#FFFFFF" stroke="#C78520" strokeWidth="2" />
                  {/* Vertex E */}
                  <circle cx="70" cy="160" r="4.5" fill="#FFFFFF" stroke="#C78520" strokeWidth="2" />
                </g>

                {/* Boundary Dimension Survey Tags */}
                <g font-family="'JetBrains Mono', monospace" font-size="10" fill="#5C4535" font-weight="600">
                  <text x="235" y="76" textAnchor="middle">184 m</text>
                  <text x="396" y="175" textAnchor="start">142 m</text>
                  <text x="290" y="298" textAnchor="middle">198 m</text>
                  <text x="110" y="250" textAnchor="end">136 m</text>
                </g>

                {/* Centroid Telemetry Sensor Node */}
                <g>
                  <circle cx="230" cy="180" r="8" fill="#10B981" fillOpacity="0.25" className="animate-ping" />
                  <circle cx="230" cy="180" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                </g>

                {/* Survey Compass & Coordinates Overlay (Grounded Digital Touch) */}
                <g transform="translate(60, 45)" font-family="'JetBrains Mono', monospace" font-size="9" fill="#786C60">
                  <circle cx="12" cy="12" r="11" stroke="#D5C2AD" strokeWidth="1" fill="#FFFFFF" />
                  <line x1="12" y1="4" x2="12" y2="20" stroke="#1B4D3E" strokeWidth="1.5" />
                  <text x="12" y="3" textAnchor="middle" font-size="8" font-weight="bold" fill="#1B4D3E">N</text>
                  <text x="32" y="15" font-weight="600">CADASTRE 10.787° N, 79.138° E</text>
                </g>

                {/* Subtitle Badge: 3.2 Acres Verified */}
                <g transform="translate(260, 340)">
                  <rect x="0" y="0" width="140" height="26" rx="13" fill="#FFFFFF" stroke="#E8E2D8" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(28,21,16,0.06))" />
                  <circle cx="14" cy="13" r="4" fill="#C78520" />
                  <text x="26" y="17" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="#1C1510">
                    Field Cadastre
                  </text>
                  <text x="108" y="17" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" fill="#1B4D3E">
                    3.2 ac
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* ================= BRAND & MESSAGE (Order 2 on mobile, 1 on desktop) ================= */}
          <div className="lg:col-span-6 lg:order-1 space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="inline-block font-mono text-xs uppercase tracking-[0.25em] text-[#1B4D3E] font-bold">
              {t('welcomeTagline', 'DIGITAL AGRICULTURAL INTELLIGENCE')}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-[#1C1510] tracking-tight leading-[1.05]">
              {t('welcomeTitle1', 'Your fields.')}<br />
              {t('welcomeTitle2', 'Your crops.')}<br />
              <span className="italic font-light text-[#1B4D3E]">{t('welcomeTitle3', 'Your decisions.')}</span>
            </h1>

            <p className="text-base sm:text-xl text-[#5C4535] font-sans font-light leading-relaxed max-w-lg mx-auto lg:mx-0">
              {t('welcomeSubtitle', 'Understand your farm through field, crop, soil and weather insights.')}
            </p>

            {/* Primary Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGetStarted}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="w-full sm:w-auto shadow-elevated cursor-pointer"
              >
                {t('getStarted', 'Get Started')}
              </Button>

              <span className="font-mono text-xs text-[#8C6B4E]">
                {t('zeroCostNote', '₹0 Cost • No Account Card Required')}
              </span>
            </div>

            {/* Core Pillars */}
            <div className="pt-6 border-t border-[#E8E2D8] grid grid-cols-3 gap-4 text-center lg:text-left text-xs">
              <div>
                <strong className="block font-serif text-sm font-bold text-[#1C1510]">{t('theFieldFirst', 'The Field First')}</strong>
                <span className="text-[#6B5E51] text-[11px]">{t('theFieldFirstDesc', 'Real cadastral land boundaries')}</span>
              </div>
              <div>
                <strong className="block font-serif text-sm font-bold text-[#1C1510]">{t('openTelemetry', 'Open Telemetry')}</strong>
                <span className="text-[#6B5E51] text-[11px]">{t('openTelemetryDesc', 'Open-Meteo & Copernicus')}</span>
              </div>
              <div>
                <strong className="block font-serif text-sm font-bold text-[#1C1510]">{t('aiAssistance', 'AI Decision Support')}</strong>
                <span className="text-[#6B5E51] text-[11px]">{t('aiAssistanceDesc', 'Grounded in verified telemetry')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Attributions */}
      <footer className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-6 text-center text-xs font-mono text-[#8C6B4E] border-t border-[#E8E2D8]">
        Kisan Open Agricultural Platform • Powered by Public Weather & Space Observation
      </footer>
    </div>
  );
};

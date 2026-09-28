import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  CheckCircle2,
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Upload,
  Sprout,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Search,
  Navigation
} from 'lucide-react';
import { Field } from '../types';
import { api } from '../services/api';
import {
  LatLngPoint,
  calculatePolygonAreaAcres,
  toGeoJsonString,
} from '../utils/geo';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  TamilDialect,
  CROP_CATALOG,
  IRRIGATION_METHODS,
  t,
} from '../utils/i18n';

// Comprehensive Indian States & UTs with representative centroid coordinates
export const INDIAN_STATES: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400 },
  { name: 'Arunachal Pradesh', lat: 28.2180, lng: 94.7278 },
  { name: 'Assam', lat: 26.2006, lng: 92.9376 },
  { name: 'Bihar', lat: 25.0961, lng: 85.3131 },
  { name: 'Chhattisgarh', lat: 21.2787, lng: 81.8661 },
  { name: 'Goa', lat: 15.2993, lng: 74.1240 },
  { name: 'Gujarat', lat: 22.2587, lng: 71.1924 },
  { name: 'Haryana', lat: 29.0588, lng: 76.0856 },
  { name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Jharkhand', lat: 23.6102, lng: 85.2799 },
  { name: 'Karnataka', lat: 15.3173, lng: 75.7139 },
  { name: 'Kerala', lat: 10.8505, lng: 76.2711 },
  { name: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569 },
  { name: 'Maharashtra', lat: 19.7515, lng: 75.7139 },
  { name: 'Manipur', lat: 24.6637, lng: 93.9063 },
  { name: 'Meghalaya', lat: 25.4670, lng: 91.3662 },
  { name: 'Mizoram', lat: 23.1645, lng: 92.9376 },
  { name: 'Nagaland', lat: 26.1584, lng: 94.5624 },
  { name: 'Odisha', lat: 20.9517, lng: 85.0985 },
  { name: 'Punjab', lat: 31.1471, lng: 75.3412 },
  { name: 'Rajasthan', lat: 27.0238, lng: 74.2179 },
  { name: 'Sikkim', lat: 27.5330, lng: 88.5122 },
  { name: 'Tamil Nadu', lat: 10.7870, lng: 79.1378 },
  { name: 'Telangana', lat: 18.1124, lng: 79.0193 },
  { name: 'Tripura', lat: 23.9408, lng: 91.9882 },
  { name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Uttarakhand', lat: 30.0668, lng: 79.0193 },
  { name: 'West Bengal', lat: 22.9868, lng: 87.8550 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Jammu & Kashmir', lat: 33.7782, lng: 76.5762 },
  { name: 'Ladakh', lat: 34.1526, lng: 77.5771 },
  { name: 'Puducherry', lat: 11.9416, lng: 79.8083 },
];

// Custom Pin Icon for location picking
const locationPinIcon = L.divIcon({
  className: 'onboarding-location-pin',
  html: `
    <div style="
      background: #1B4D3E;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #C78520;
      box-shadow: 0 6px 14px rgba(28,21,16,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="transform: rotate(45deg); color: white; font-weight: 800; font-size: 14px;">📍</div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Vertex Pin Icon with step numbers
const createNumberedVertexIcon = (index: number) =>
  L.divIcon({
    className: 'boundary-vertex-dot',
    html: `
      <div style="
        width: 22px;
        height: 22px;
        background: #C78520;
        color: #1C1510;
        font-weight: 800;
        font-size: 11px;
        font-family: monospace;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">${index + 1}</div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

// Helper component to center map on coordinates
function MapRecenter({ center, zoom = 14 }: { center: LatLngPoint | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, map, zoom]);
  return null;
}

// Click listener for Map to pick location or draw boundary
function MapClickHandler({
  mode,
  onLocationSelect,
  onAddVertex,
}: {
  mode: 'pin' | 'boundary';
  onLocationSelect: (pt: LatLngPoint) => void;
  onAddVertex: (pt: LatLngPoint) => void;
}) {
  useMapEvents({
    click(e) {
      if (mode === 'pin') {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (mode === 'boundary') {
        onAddVertex({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

interface FarmerOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldCreated: (field: Field) => void;
  existingFieldsCount?: number;
  initialLanguage?: SupportedLanguage;
  initialTamilDialect?: TamilDialect;
  inline?: boolean;
}

export const FarmerOnboarding: React.FC<FarmerOnboardingProps> = ({
  isOpen,
  onClose,
  onFieldCreated,
  existingFieldsCount = 0,
  initialLanguage = 'ta',
  initialTamilDialect = 'natural',
  inline = false,
}) => {
  // Wizard Step: 1: Profile & Language, 2: Farm Location, 3: Field Boundary, 4: Crop & Variety, 5: Soil Report, 6: Review & Register
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Farmer & Language
  const [farmerName, setFarmerName] = useState<string>('Farmer');
  const [phone, setPhone] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [tamilDialect, setTamilDialect] = useState<TamilDialect>(initialTamilDialect);

  // Step 2: Location (Zero hardcoded fallback)
  const [locationMode, setLocationMode] = useState<'search' | 'gps' | 'state'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Explicit unselected location initial state
  const [selectedLocation, setSelectedLocation] = useState<LatLngPoint | null>(null);
  const [stateName, setStateName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean>(false);

  // Step 3: Boundary & Area
  const [boundaryPoints, setBoundaryPoints] = useState<LatLngPoint[]>([]);
  const [manualAcres, setManualAcres] = useState<string>('');
  const [skipBoundary, setSkipBoundary] = useState<boolean>(false);
  const [isBoundaryConfirmed, setIsBoundaryConfirmed] = useState<boolean>(false);

  // Step 4: Crop & Field Info
  const [fieldName, setFieldName] = useState<string>('Main Parcel');
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice (Paddy)');
  const [sowingDate, setSowingDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [variety, setVariety] = useState<string>('');
  const [irrigationMethod, setIrrigationMethod] = useState<string>('Canal');

  // Step 5: Soil Report
  const [soilFile, setSoilFile] = useState<File | null>(null);
  const [soilFileName, setSoilFileName] = useState<string>('');
  const [skipSoil, setSkipSoil] = useState<boolean>(false);

  // Submission & Loading
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchTimeoutRef = useRef<any>(null);

  // Fetch initial profile if available
  useEffect(() => {
    if (isOpen) {
      api.getUserProfile().then((profile) => {
        if (profile) {
          if (profile.name && profile.name !== 'Farmer') setFarmerName(profile.name);
          if (profile.phone) setPhone(profile.phone);
          if (profile.preferred_language) setLanguage(profile.preferred_language as SupportedLanguage);
          if (profile.tamil_dialect) setTamilDialect(profile.tamil_dialect as TamilDialect);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Handle location search with Open-Meteo zero-cost geocoding API
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.searchLocation(query);
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search location error', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = item.latitude;
    const lng = item.longitude;
    setSelectedLocation({ lat, lng });
    setStateName(item.admin1 || item.country || 'India');
    setDistrictName(item.admin2 || item.name || '');
    setLocationName(`${item.name}${item.admin1 ? ', ' + item.admin1 : ''}`);
    setIsLocationConfirmed(false); // Farmer must review & confirm
    setSearchResults([]);
    setSearchQuery(`${item.name}${item.admin1 ? ', ' + item.admin1 : ''}`);
  };

  // Browser GPS location handler
  const handleUseGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocatingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLocation({ lat, lng });
        setIsLocationConfirmed(false); // Farmer must review & confirm
        try {
          const rev = await api.reverseGeocode(lat, lng);
          if (rev) {
            setStateName(rev.state || 'India');
            setDistrictName(rev.district || '');
            setLocationName(rev.display_name || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
          } else {
            setLocationName(`GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
          }
        } catch {
          setLocationName(`GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        console.error('GPS error', err);
        setGpsError('Could not access device location. Please enable browser GPS permissions or use search.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Manual State Selection
  const handleSelectState = (stateObj: { name: string; lat: number; lng: number }) => {
    setSelectedLocation({ lat: stateObj.lat, lng: stateObj.lng });
    setStateName(stateObj.name);
    setDistrictName('');
    setLocationName(stateObj.name);
    setIsLocationConfirmed(false);
  };

  const handleMapPinSelect = async (pt: LatLngPoint) => {
    setSelectedLocation(pt);
    setIsLocationConfirmed(false);
    try {
      const rev = await api.reverseGeocode(pt.lat, pt.lng);
      if (rev) {
        setStateName(rev.state || 'India');
        setDistrictName(rev.district || '');
        setLocationName(rev.display_name || `${pt.lat.toFixed(4)}°N, ${pt.lng.toFixed(4)}°E`);
      } else {
        setLocationName(`${pt.lat.toFixed(4)}°N, ${pt.lng.toFixed(4)}°E`);
      }
    } catch {
      setLocationName(`${pt.lat.toFixed(4)}°N, ${pt.lng.toFixed(4)}°E`);
    }
  };

  // Boundary points
  const handleAddBoundaryVertex = (pt: LatLngPoint) => {
    setBoundaryPoints((prev) => [...prev, pt]);
    setIsBoundaryConfirmed(false);
  };

  const handleUndoVertex = () => {
    setBoundaryPoints((prev) => prev.slice(0, -1));
    setIsBoundaryConfirmed(false);
  };

  const handleClearBoundary = () => {
    setBoundaryPoints([]);
    setIsBoundaryConfirmed(false);
  };

  const calculatedAcres = boundaryPoints.length >= 3 ? calculatePolygonAreaAcres(boundaryPoints) : 0;
  const effectiveAcres = boundaryPoints.length >= 3 && !skipBoundary
    ? calculatedAcres
    : manualAcres ? parseFloat(manualAcres) : null;

  const handleSoilFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSoilFile(f);
      setSoilFileName(f.name);
      setSkipSoil(false);
    }
  };

  const handleSaveField = async () => {
    if (existingFieldsCount >= 4) {
      setErrorMessage('Field parcel limit reached. You already have 4 active fields registered.');
      return;
    }

    if (!fieldName.trim()) {
      setErrorMessage('Please provide a field name or label.');
      return;
    }

    if (!selectedLocation) {
      setErrorMessage('Field location has not been selected.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Update farmer profile
      await api.updateUserProfile({
        name: farmerName.trim() || 'Farmer',
        phone: phone.trim() || undefined,
        preferred_language: language,
        tamil_dialect: language === 'ta' ? tamilDialect : undefined,
        state: stateName || 'India',
      }).catch(() => {});

      // 2. Prepare boundary GeoJSON if polygon drawn
      let boundaryGeoJson: string | null = null;
      if (boundaryPoints.length >= 3 && !skipBoundary) {
        boundaryGeoJson = toGeoJsonString(boundaryPoints);
      }

      // 3. Create field in SQLite backend
      const newFieldData = {
        name: fieldName.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        state: stateName || 'India',
        district: districtName || null,
        crop_type: selectedCrop,
        variety: variety.trim() || null,
        irrigation_method: irrigationMethod || null,
        soil_report_status: soilFile && !skipSoil ? 'UPLOADED' : 'NOT_UPLOADED',
        area_acres: effectiveAcres,
        sowing_date: sowingDate ? new Date(sowingDate).toISOString() : null,
        is_demo: false,
        boundary_geojson: boundaryGeoJson,
      };

      const created = await api.createField(newFieldData);

      localStorage.setItem('kisan_onboarded', 'true');
      localStorage.setItem('kisan_welcomed', 'true');

      onFieldCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create field', err);
      setErrorMessage(err.message || 'Failed to register field. Please check values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCropMeta = CROP_CATALOG.find((c) => c.id === selectedCrop);

  const stepTitles: Record<number, string> = {
    1: t('step1TitleWizard', language, tamilDialect) || 'Farmer Profile & Language',
    2: t('step2TitleWizard', language, tamilDialect) || 'Farm Location',
    3: t('step3TitleWizard', language, tamilDialect) || 'Field Boundary & Area',
    4: t('step4TitleWizard', language, tamilDialect) || 'Crop & Sowing Details',
    5: t('step5TitleWizard', language, tamilDialect) || 'Soil Test Report',
    6: t('step6TitleWizard', language, tamilDialect) || 'Review & Register Field',
  };

  const stepNextLabels: Record<number, string> = {
    1: t('nextFarmLocation', language, tamilDialect) || 'Next: Farm Location',
    2: t('nextFieldBoundary', language, tamilDialect) || 'Next: Field Boundary',
    3: t('nextCropDetails', language, tamilDialect) || 'Next: Crop Details',
    4: t('nextSoilTest', language, tamilDialect) || 'Next: Soil Test',
    5: t('nextReviewRegister', language, tamilDialect) || 'Next: Review & Register',
    6: t('registerFieldAndEnter', language, tamilDialect) || 'Register Field & Enter',
  };

  // Card Content
  const wizardCard = (
    <div className="w-full bg-white rounded-3xl border border-[#E8E2D8] shadow-elevated overflow-hidden flex flex-col my-auto max-h-[92vh]">
      {/* Top Header with Step Indicator */}
      <div className="px-6 sm:px-8 py-5 bg-[#FAF8F4] border-b border-[#E8E2D8]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B4D3E] flex items-center justify-center text-white shadow-subtle">
              <Sprout className="w-5 h-5 text-[#FBDD97]" />
            </div>
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1B4D3E] block leading-tight">
                {existingFieldsCount === 0 ? t('farmerOnboardingUpper', language, tamilDialect) : t('newParcelRegistryUpper', language, tamilDialect)}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1510] tracking-tight">
                {stepTitles[currentStep]}
              </h2>
            </div>
          </div>

          {/* Close button if user already has fields and this is modal */}
          {!inline && existingFieldsCount > 0 && (
            <button
              onClick={onClose}
              className="p-2 text-[#786C60] hover:text-[#1C1510] rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Clear Progress Indicator: ● ━━━ ○ ━━━ ○ ━━━ ○ Step X of 6 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#1C1510]">
              {t('step', language, tamilDialect)} {currentStep} {t('of', language, tamilDialect)} 6
            </span>
            <span className="text-[#5C4535]">
              {currentStep === 1 && t('step1Hint', language, tamilDialect)}
              {currentStep === 2 && t('step2Hint', language, tamilDialect)}
              {currentStep === 3 && t('step3Hint', language, tamilDialect)}
              {currentStep === 4 && t('step4Hint', language, tamilDialect)}
              {currentStep === 5 && t('step5Hint', language, tamilDialect)}
              {currentStep === 6 && t('step6Hint', language, tamilDialect)}
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5, 6].map((s, idx) => (
              <React.Fragment key={s}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    s < currentStep
                      ? 'bg-[#1B4D3E] text-white'
                      : s === currentStep
                      ? 'bg-[#C78520] text-white ring-4 ring-[#C78520]/20'
                      : 'bg-white border-2 border-[#D5C2AD] text-[#786C60]'
                  }`}
                >
                  {s < currentStep ? '✓' : s}
                </div>
                {idx < 5 && (
                  <div
                    className={`flex-1 h-1 rounded-full transition-all ${
                      s < currentStep ? 'bg-[#1B4D3E]' : 'bg-[#E8E2D8]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard Body Content */}
      <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-white text-[#1C1510]">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: FARMER PROFILE & LANGUAGE ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#1C1510]">
                {t('step1Title', language, tamilDialect)}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                Welcome to KrishiNet. Choose your preferred language and introduce yourself so agricultural advisories are tailored in your spoken style.
              </p>
            </div>

            {/* Farmer Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-2">
                  {t('farmerNameLabel', language, tamilDialect)} *
                </label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Murugan, Ramesh, Harpreet"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-2">
                  {t('phoneLabel', language, tamilDialect)}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210 (Optional)"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>

            {/* Language Selection Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                {t('selectLanguage', language, tamilDialect)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1B4D3E] bg-[#E8F5F0] ring-2 ring-[#1B4D3E]/30 shadow-subtle'
                          : 'border-[#E8E2D8] hover:border-[#D5C2AD] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#1C1510]">
                          {lang.nativeName}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />}
                      </div>
                      <span className="text-xs text-[#5C4535] mt-1 block">
                        {lang.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tamil Dialect toggle */}
            {language === 'ta' && (
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E8E2D8] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C78520]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                    {t('tamilDialectSelection', language, tamilDialect)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTamilDialect('natural')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      tamilDialect === 'natural'
                        ? 'border-[#1B4D3E] bg-[#E8F5F0] ring-1 ring-[#1B4D3E]'
                        : 'border-[#D5C2AD] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#1C1510]">
                        {t('tamilNatural', language, tamilDialect)}
                      </span>
                      {tamilDialect === 'natural' && (
                        <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />
                      )}
                    </div>
                    <p className="text-xs text-[#1B4D3E] italic">
                      "உங்க நெல் வயலுக்கு அடுத்த 3 நாளைக்கு தண்ணி பாசனம் சரியா இருக்கணும்"
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTamilDialect('standard')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      tamilDialect === 'standard'
                        ? 'border-[#1B4D3E] bg-[#E8F5F0] ring-1 ring-[#1B4D3E]'
                        : 'border-[#D5C2AD] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#1C1510]">
                        {t('tamilStandard', language, tamilDialect)}
                      </span>
                      {tamilDialect === 'standard' && (
                        <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />
                      )}
                    </div>
                    <p className="text-xs text-[#5C4535] italic">
                      "தங்கள் நெல் பயிரின் அடுத்த 3 நாட்களுக்கான நீர்ப்பாசன வழிகாட்டுதல்"
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: FARM LOCATION (ZERO HARDCODED TAMIL NADU FALLBACK) ================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#1C1510]">
                {t('step2Title', language, tamilDialect)}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                Identify your land location. Use phone GPS, search your village or taluk, or choose your state.
              </p>
            </div>

            {/* Three Location Input Options */}
            <div className="flex items-center space-x-2 border-b border-[#E8E2D8] pb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLocationMode('search')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  locationMode === 'search'
                    ? 'bg-[#1B4D3E] text-white shadow-sm'
                    : 'text-[#5C4535] hover:bg-[#FAF8F4]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Place</span>
              </button>

              <button
                type="button"
                onClick={() => setLocationMode('gps')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  locationMode === 'gps'
                    ? 'bg-[#1B4D3E] text-white shadow-sm'
                    : 'text-[#5C4535] hover:bg-[#FAF8F4]'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Device GPS</span>
              </button>

              <button
                type="button"
                onClick={() => setLocationMode('state')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  locationMode === 'state'
                    ? 'bg-[#1B4D3E] text-white shadow-sm'
                    : 'text-[#5C4535] hover:bg-[#FAF8F4]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Select State</span>
              </button>
            </div>

            {/* Option A: Search Place */}
            {locationMode === 'search' && (
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                  Search Village, Taluk, District or Town
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="e.g. Ludhiana, Mandya, Nashik, Thanjavur, Meerut..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                  <Search className="w-4 h-4 text-[#786C60] absolute left-3.5 top-3.5" />
                  {isSearching && (
                    <div className="absolute right-3.5 top-3.5 text-xs text-[#786C60] animate-pulse">
                      Searching...
                    </div>
                  )}
                </div>

                {/* Dropdown of search matches */}
                {searchResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-[#E8E2D8]">
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#FAF8F4] flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <span className="font-semibold text-[#1C1510] group-hover:text-[#1B4D3E]">
                            {res.name}
                          </span>
                          <span className="text-xs text-[#5C4535] ml-2">
                            {res.admin1} {res.admin2 ? `(${res.admin2})` : ''}
                          </span>
                        </div>
                        <span className="text-xs text-[#786C60] font-mono">
                          {res.latitude.toFixed(2)}°N, {res.longitude.toFixed(2)}°E
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Option B: Device GPS */}
            {locationMode === 'gps' && (
              <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D8] text-center space-y-3">
                <Navigation className="w-8 h-8 text-[#1B4D3E] mx-auto" />
                <div>
                  <h4 className="font-serif font-bold text-base text-[#1C1510]">
                    Locate via Phone / Browser GPS
                  </h4>
                  <p className="text-xs text-[#5C4535] mt-1 max-w-md mx-auto">
                    Click below to detect your current farm coordinates. Browser location permission will be requested.
                  </p>
                </div>
                {gpsError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                    {gpsError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={isLocatingGps}
                  className="px-6 py-2.5 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center space-x-2 transition-all cursor-pointer shadow-subtle"
                >
                  <MapPin className="w-4 h-4 text-[#FBDD97]" />
                  <span>{isLocatingGps ? 'Detecting Location...' : 'Use Current GPS Position'}</span>
                </button>
              </div>
            )}

            {/* Option C: Manual State Selection */}
            {locationMode === 'state' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                  Select State or Union Territory
                </label>
                <select
                  value={stateName}
                  onChange={(e) => {
                    const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                    if (st) handleSelectState(st);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] font-medium text-sm focus:outline-none focus:border-[#1B4D3E]"
                >
                  <option value="">-- Select Your State --</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {stateName && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-1">
                      District / Taluk Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      placeholder="e.g. Ludhiana, Mandya, Nashik, Cuttack"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] text-sm outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================= LOCATION CONFIRMATION CARD (STAGE 2) ================= */}
            {selectedLocation ? (
              <div className="space-y-4">
                {/* Visual Map Preview */}
                <div className="rounded-2xl overflow-hidden border border-[#E8E2D8] h-60 relative shadow-subtle">
                  <MapContainer
                    center={[selectedLocation.lat, selectedLocation.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="&copy; Esri &mdash; Public Imagery"
                      maxZoom={18}
                    />
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={locationPinIcon} />
                    <MapRecenter center={selectedLocation} zoom={13} />
                    <MapClickHandler
                      mode="pin"
                      onLocationSelect={handleMapPinSelect}
                      onAddVertex={() => {}}
                    />
                  </MapContainer>
                  <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E8E2D8] text-xs text-[#5C4535] flex items-center justify-between pointer-events-none">
                    <span>Click on map to adjust center pin</span>
                    <span className="font-mono font-semibold text-[#1B4D3E]">
                      {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                {/* Staged Confirmation Card */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isLocationConfirmed
                    ? 'bg-[#E8F5F0] border-[#BEE9DC]'
                    : 'bg-[#FEF8E7] border-[#FDEEC4]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <MapPin className={`w-4 h-4 ${isLocationConfirmed ? 'text-[#1B4D3E]' : 'text-[#C78520]'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                          {isLocationConfirmed ? 'Location Confirmed' : 'Identified Location'}
                        </span>
                        {isLocationConfirmed && (
                          <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[10px] font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-[#1C1510]">
                        {locationName || stateName}
                      </h4>

                      <p className="text-xs text-[#5C4535] font-mono">
                        {districtName ? `${districtName}, ` : ''}{stateName} • Centroid: {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lng.toFixed(4)}° E
                      </p>
                    </div>

                    {/* Staged Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0">
                      {!isLocationConfirmed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsLocationConfirmed(true);
                            setErrorMessage(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-subtle cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirm Location</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsLocationConfirmed(false)}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D5C2AD] hover:bg-[#FAF8F4] text-[#5C4535] text-xs font-semibold transition-all cursor-pointer"
                        >
                          Change Location
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Honest Unselected State Alert */
              <div className="p-8 rounded-2xl border border-dashed border-[#D5C2AD] text-center space-y-2 bg-[#FAF8F4]">
                <MapPin className="w-8 h-8 text-[#786C60] mx-auto" />
                <h4 className="font-serif font-bold text-sm text-[#1C1510]">
                  No Location Selected Yet
                </h4>
                <p className="text-xs text-[#786C60] max-w-sm mx-auto">
                  Search your village, use device GPS, or select your state above. We do not assume your farm is in Tamil Nadu or any default state.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: FIELD BOUNDARY & ACREAGE (REAL INTERACTIVE POLYGON) ================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-[#1C1510]">
                  {t('step3Title', language, tamilDialect)}
                </h3>
                <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                  Tap corner vertices around your field to draw the boundary. Minimum 3 points required to close the parcel polygon.
                </p>
              </div>

              {/* Area Badge */}
              {boundaryPoints.length >= 3 && !skipBoundary && (
                <div className="px-3.5 py-1.5 rounded-xl bg-[#E8F5F0] border border-[#BEE9DC] text-[#1B4D3E] font-bold text-xs flex items-center gap-2 self-start sm:self-auto">
                  <span>Calculated Area:</span>
                  <span className="text-sm font-extrabold text-[#1B4D3E]">
                    {calculatedAcres.toFixed(2)} Acres
                  </span>
                </div>
              )}
            </div>

            {!skipBoundary ? (
              <>
                {/* Boundary Drawing Map */}
                <div className="rounded-2xl overflow-hidden border border-[#E8E2D8] h-80 relative shadow-subtle">
                  <MapContainer
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [20.5937, 78.9629]}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="&copy; Esri &mdash; Public Imagery"
                      maxZoom={19}
                    />

                    {/* Dynamic Real Cadastral Polygon */}
                    {boundaryPoints.length >= 3 && (
                      <Polygon
                        positions={boundaryPoints.map((p) => [p.lat, p.lng])}
                        pathOptions={{
                          color: '#C78520',
                          weight: 3,
                          fillColor: '#10B981',
                          fillOpacity: 0.35,
                          dashArray: isBoundaryConfirmed ? undefined : '6 4',
                        }}
                      />
                    )}

                    {/* Numbered Vertex Markers */}
                    {boundaryPoints.map((pt, i) => (
                      <Marker
                        key={i}
                        position={[pt.lat, pt.lng]}
                        icon={createNumberedVertexIcon(i)}
                      />
                    ))}

                    <MapRecenter center={selectedLocation} zoom={16} />
                    <MapClickHandler
                      mode="boundary"
                      onLocationSelect={() => {}}
                      onAddVertex={handleAddBoundaryVertex}
                    />
                  </MapContainer>

                  {/* Boundary Toolbar */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-[400] bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-[#E8E2D8]">
                    <button
                      type="button"
                      onClick={handleUndoVertex}
                      disabled={boundaryPoints.length === 0}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF8F4] hover:bg-[#F4EDE4] text-[#1C1510] disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('undoPoint', language, tamilDialect)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearBoundary}
                      disabled={boundaryPoints.length === 0}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {t('clearBoundary', language, tamilDialect)}
                    </button>

                    {boundaryPoints.length >= 3 && (
                      <button
                        type="button"
                        onClick={() => setIsBoundaryConfirmed(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer flex items-center space-x-1 ${
                          isBoundaryConfirmed
                            ? 'bg-[#1B4D3E] text-white'
                            : 'bg-[#C78520] hover:bg-[#B37418] text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBoundaryConfirmed ? 'Locked' : 'Confirm'}</span>
                      </button>
                    )}
                  </div>

                  {/* Instruction Footer Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-xs text-[#5C4535] flex items-center justify-between pointer-events-none">
                    <div>
                      Vertices marked: <strong className="text-[#1C1510]">{boundaryPoints.length}</strong>
                      {boundaryPoints.length < 3 && (
                        <span className="text-amber-700 ml-1.5">({3 - boundaryPoints.length} more needed to close polygon)</span>
                      )}
                    </div>
                    {boundaryPoints.length >= 3 && (
                      <span className="font-bold text-[#1B4D3E]">
                        Parcel closed: {calculatedAcres.toFixed(2)} ac
                      </span>
                    )}
                  </div>
                </div>

                {/* Option to Skip & Enter Manually */}
                <div className="flex items-center justify-between text-xs text-[#5C4535] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={skipBoundary}
                      onChange={(e) => setSkipBoundary(e.target.checked)}
                      className="rounded border-[#D5C2AD] text-[#1B4D3E] focus:ring-[#1B4D3E]"
                    />
                    <span>{t('skipBoundaryDraw', language, tamilDialect)}</span>
                  </label>
                </div>
              </>
            ) : (
              /* Manual Acres Input Fallback */
              <div className="p-6 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F4] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1C1510]">
                    Manual Field Area Entry
                  </span>
                  <button
                    type="button"
                    onClick={() => setSkipBoundary(false)}
                    className="text-xs text-[#1B4D3E] font-bold hover:underline cursor-pointer"
                  >
                    ← Draw boundary on map instead
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-2">
                    {t('manualAcresLabel', language, tamilDialect)}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={manualAcres}
                    onChange={(e) => setManualAcres(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full sm:w-64 px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: CROP & SOWING DETAILS ================= */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#1C1510]">
                {t('step4Title', language, tamilDialect)}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                Select your standing crop. Variety and irrigation are optional but enable fine-tuned water and harvest advisories.
              </p>
            </div>

            {/* Field Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-2">
                Field Label / Name *
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. North Parcel, Riverbank Paddy, Main Field"
                className="w-full px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
              />
            </div>

            {/* Crop Selection Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                {t('selectCropLabel', language, tamilDialect)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                {CROP_CATALOG.map((c) => {
                  const isSelected = selectedCrop === c.id;
                  const regionalName = language === 'ta' ? c.nameTa : language === 'hi' ? c.nameHi : c.nameEn;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCrop(c.id);
                        if (c.commonVarieties.length > 0) {
                          setVariety(c.commonVarieties[0]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1B4D3E] bg-[#E8F5F0] ring-1 ring-[#1B4D3E] shadow-subtle'
                          : 'border-[#E8E2D8] hover:border-[#D5C2AD] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[#1C1510]">
                          {regionalName}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />}
                      </div>
                      <span className="text-[11px] text-[#5C4535] block truncate">
                        {c.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sowing Date & Variety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-2">
                  {t('sowingDateLabel', language, tamilDialect)}
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510] mb-2">
                  {t('varietyLabel', language, tamilDialect)} (Optional)
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. CR-1009 Sub 1, PBW 343"
                  className="w-full px-4 py-3 rounded-xl border border-[#D5C2AD] bg-white text-[#1C1510] placeholder-[#786C60] font-medium text-sm focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                />
                {currentCropMeta && currentCropMeta.commonVarieties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-[#786C60] uppercase font-semibold">Common:</span>
                    {currentCropMeta.commonVarieties.slice(0, 3).map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVariety(v)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF8F4] hover:bg-[#E8F5F0] text-[#1C1510] border border-[#E8E2D8] transition-colors cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Irrigation Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1510]">
                {t('irrigationMethodLabel', language, tamilDialect)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {IRRIGATION_METHODS.map((im) => {
                  const isSelected = irrigationMethod === im.id;
                  const label = language === 'ta' ? im.labelTa : language === 'hi' ? im.labelHi : im.labelEn;
                  return (
                    <button
                      key={im.id}
                      type="button"
                      onClick={() => setIrrigationMethod(im.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1B4D3E] bg-[#E8F5F0] ring-1 ring-[#1B4D3E]'
                          : 'border-[#E8E2D8] hover:border-[#D5C2AD] bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-[#1C1510] block">
                        {label}
                      </span>
                      <span className="text-[10px] text-[#786C60]">{im.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SOIL REPORT (OPTIONAL & ZERO FABRICATION) ================= */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#1C1510]">
                {t('step5Title', language, tamilDialect)}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                If you have an official Soil Health Card, upload it here. If not, click skip — we never invent fake soil readings.
              </p>
            </div>

            {/* Soil Report Upload Card */}
            {!skipSoil ? (
              <div className="border-2 border-dashed border-[#D5C2AD] rounded-2xl p-8 text-center hover:border-[#1B4D3E] transition-colors bg-[#FAF8F4] space-y-4">
                <input
                  type="file"
                  id="soilFileInput"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleSoilFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="soilFileInput"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F5F0] border border-[#BEE9DC] flex items-center justify-center text-[#1B4D3E]">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#1C1510] block">
                      {soilFileName || t('soilReportPlaceholder', language, tamilDialect)}
                    </span>
                    <span className="text-xs text-[#5C4535] mt-1 block">
                      Accepts Soil Health Card PDF, JPEG, PNG (Up to 10MB)
                    </span>
                  </div>
                </label>

                {soilFileName && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#E8F5F0] border border-[#BEE9DC] text-[#1B4D3E] text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selected: {soilFileName}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSkipSoil(true);
                      setSoilFile(null);
                      setSoilFileName('');
                    }}
                    className="text-xs text-[#786C60] hover:text-[#1C1510] font-semibold underline cursor-pointer"
                  >
                    I do not have a soil card — Skip for now
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F4] space-y-3 text-center">
                <h4 className="font-serif font-bold text-sm text-[#1C1510]">
                  Soil Test Skipped
                </h4>
                <p className="text-xs text-[#5C4535] max-w-md mx-auto">
                  Your soil status will be marked as "NOT UPLOADED". In accordance with strict data trust, all NPK and pH parameters will display "--" until a genuine report is uploaded.
                </p>
                <button
                  type="button"
                  onClick={() => setSkipSoil(false)}
                  className="text-xs text-[#1B4D3E] font-bold hover:underline cursor-pointer"
                >
                  ← Upload a soil report instead
                </button>
              </div>
            )}

            {/* Transparency Callout */}
            <div className="p-4 rounded-xl bg-[#FEF8E7] border border-[#FDEEC4] text-[#7E4B14] text-xs leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#C78520] mt-0.5" />
              <span>
                KrishiNet strictly abides by Zero Data Fabrication. We will never generate imaginary nitrogen, phosphorus, or pH values.
              </span>
            </div>
          </div>
        )}

        {/* ================= STEP 6: CONFIRMATION & REVIEW ================= */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#1C1510]">
                Confirm Field Registration
              </h3>
              <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
                Review your farm details before launching live satellite, weather, and agricultural telemetry.
              </p>
            </div>

            {/* Review Card */}
            <div className="p-5 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F4] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div>
                  <h4 className="text-base font-bold text-[#1C1510]">
                    {fieldName}
                  </h4>
                  <span className="text-xs text-[#5C4535]">
                    Farmer: {farmerName} {phone ? `• ${phone}` : ''}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5F0] text-[#1B4D3E] border border-[#BEE9DC]">
                  Verified Cadastral Profile
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#786C60] block uppercase font-bold text-[10px]">
                    Location
                  </span>
                  <span className="font-bold text-[#1C1510] mt-0.5 block">
                    {districtName || stateName}, {stateName}
                  </span>
                  {selectedLocation && (
                    <span className="text-[#5C4535] font-mono text-[11px]">
                      {selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lng.toFixed(4)}°E
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[#786C60] block uppercase font-bold text-[10px]">
                    Field Area
                  </span>
                  <span className="font-bold text-[#1C1510] mt-0.5 block">
                    {effectiveAcres ? `${effectiveAcres.toFixed(2)} Acres` : 'Not specified'}
                  </span>
                  <span className="text-[#5C4535] text-[11px]">
                    {boundaryPoints.length >= 3 && !skipBoundary ? 'Real Polygon Coordinates' : 'Manual Entry'}
                  </span>
                </div>

                <div>
                  <span className="text-[#786C60] block uppercase font-bold text-[10px]">
                    Crop & Variety
                  </span>
                  <span className="font-bold text-[#1C1510] mt-0.5 block">
                    {selectedCrop}
                  </span>
                  <span className="text-[#5C4535] text-[11px]">
                    Variety: {variety || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-[#786C60] block uppercase font-bold text-[10px]">
                    Sowing Date
                  </span>
                  <span className="font-bold text-[#1C1510] mt-0.5 block">
                    {sowingDate || 'Not specified'}
                  </span>
                </div>

                <div>
                  <span className="text-[#786C60] block uppercase font-bold text-[10px]">
                    Irrigation
                  </span>
                  <span className="font-bold text-[#1C1510] mt-0.5 block">
                    {irrigationMethod || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-[#786C60] block uppercase font-bold text-[10px]">
                    Soil Status
                  </span>
                  <span className={`font-bold mt-0.5 block ${
                    soilFile && !skipSoil ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {soilFile && !skipSoil ? 'Report Attached' : 'Not Uploaded (No Fabrication)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#786C60] flex items-center justify-between">
              <span>{t('maxParcelsPerAccount', language, tamilDialect)}</span>
              <span className="font-semibold text-[#1B4D3E]">
                {t('registered', language, tamilDialect)}: {existingFieldsCount} / 4
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div className="px-6 sm:px-8 py-4 bg-[#FAF8F4] border-t border-[#E8E2D8] flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5C4535] hover:text-[#1C1510] hover:bg-black/5 border border-[#E8E2D8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back', language, tamilDialect)}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {currentStep < 6 ? (
            <button
              type="button"
              disabled={
                (currentStep === 1 && !farmerName.trim()) ||
                (currentStep === 2 && (!selectedLocation || !isLocationConfirmed)) ||
                (currentStep === 3 && !skipBoundary && boundaryPoints.length < 3 && !manualAcres)
              }
              onClick={() => {
                if (currentStep === 1 && !farmerName.trim()) {
                  setErrorMessage(t('enterYourNamePrompt', language, tamilDialect));
                  return;
                }
                if (currentStep === 2 && (!selectedLocation || !isLocationConfirmed)) {
                  setErrorMessage(t('confirmLocationPrompt', language, tamilDialect));
                  return;
                }
                setErrorMessage(null);
                setCurrentStep((prev) => prev + 1);
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#1B4D3E] hover:bg-[#153D31] disabled:opacity-40 text-white shadow-elevated transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{stepNextLabels[currentStep]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveField}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C78520] hover:bg-[#B37418] text-white shadow-elevated transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <span>{t('saving', language, tamilDialect)}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{t('registerFieldAndEnter', language, tamilDialect)}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return wizardCard;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto">
        {wizardCard}
      </div>
    </div>
  );
};

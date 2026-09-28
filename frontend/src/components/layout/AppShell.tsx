import React, { useState, useEffect } from 'react';
import { useRouter, RouteName } from '../../router/RouterContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { api } from '../../services/api';
import { useNetwork } from '../../context/NetworkContext';
import { NetworkIndicator } from '../NetworkIndicator';
import {
  Home,
  Layers,
  Microscope,
  Sparkles,
  User,
  Settings,
  Sprout,
  Plus,
  Bell,
  WifiOff
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentRoute, navigate } = useRouter();
  const { t } = useLanguage();
  const { isOnline } = useNetwork();
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    api.getAlertCount()
      .then(data => {
        if (isMounted) setUnreadAlerts(data.unread);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [currentRoute]);

  // If on welcome, login, or onboarding screen, render standalone without shell navigation bars
  if (currentRoute === 'welcome' || currentRoute === 'login' || currentRoute === 'onboarding') {
    return <div className="min-h-screen bg-[#FAF8F4] text-[#1C1510]">{children}</div>;
  }

  const navItems: Array<{
    id: RouteName;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'home',
      label: t('home', 'Home'),
      mobileLabel: t('home', 'Home'),
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'fields',
      label: t('fields', 'Fields'),
      mobileLabel: t('fields', 'Fields'),
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: 'check-crop',
      label: t('checkCrop', 'Check Crop'),
      mobileLabel: t('checkCrop', 'Check'),
      icon: <Microscope className="w-5 h-5" />,
    },
    {
      id: 'ask-field',
      label: t('askMyField', 'Ask My Field'),
      mobileLabel: t('askMyField', 'Ask'),
      icon: <Sparkles className="w-5 h-5 text-[#C78520]" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1C1510] font-sans selection:bg-[#BEE9DC] selection:text-[#0F2F26]">
      {/* ================= DESKTOP HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E8E2D8] select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => navigate('home')}
            className="flex items-center space-x-2.5 cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Kisan Home"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1B4D3E] flex items-center justify-center text-white shadow-subtle group-hover:bg-[#143C30] transition-colors">
              <Sprout className="w-4 h-4 text-[#FBDD97]" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-serif font-black text-xl tracking-tight text-[#1C1510]">
                {t('appTitle', 'KISAN')}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5F0] text-[#1B4D3E] border border-[#BEE9DC]">
                {t('openDataBadge', '₹0 OPEN DATA')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Desktop Navigation">
            {navItems.map((item) => {
              const isActive = currentRoute === item.id || (item.id === 'fields' && currentRoute === 'field-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#1C1510] text-white shadow-subtle'
                      : 'text-[#5C4535] hover:text-[#1C1510] hover:bg-[#F4EDE4]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Network, Language, Add Field, Profile & Settings */}
          <div className="flex items-center space-x-2">
            <NetworkIndicator />
            <LanguageSelector variant="compact" />

            <button
              onClick={() => navigate('add-field')}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1B4D3E] hover:bg-[#143C30] text-white shadow-subtle transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addField', 'Add Field')}</span>
            </button>

            <button
              onClick={() => navigate('alerts')}
              className={`relative p-2 rounded-full border transition-all cursor-pointer ${
                currentRoute === 'alerts'
                  ? 'bg-[#1C1510] text-white border-[#1C1510]'
                  : 'bg-white border-[#E8E2D8] text-[#5C4535] hover:text-[#1C1510] hover:bg-[#FAF8F4]'
              }`}
              title={t('farmerAlerts', 'Farmer Alerts')}
              aria-label={t('farmerAlerts', 'Farmer Alerts')}
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#B54708] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAF8F4]">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('profile')}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                currentRoute === 'profile'
                  ? 'bg-[#1C1510] text-white border-[#1C1510]'
                  : 'bg-white border-[#E8E2D8] text-[#5C4535] hover:text-[#1C1510] hover:bg-[#FAF8F4]'
              }`}
              title={t('profile', 'Farmer Profile')}
              aria-label={t('profile', 'Farmer Profile')}
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('settings')}
              className={`hidden sm:inline-flex p-2 rounded-full border transition-all cursor-pointer ${
                currentRoute === 'settings'
                  ? 'bg-[#1C1510] text-white border-[#1C1510]'
                  : 'bg-white border-[#E8E2D8] text-[#5C4535] hover:text-[#1C1510] hover:bg-[#FAF8F4]'
              }`}
              title={t('settings', 'Settings')}
              aria-label={t('settings', 'Settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= UNOBTRUSIVE OFFLINE BANNER ================= */}
      {!isOnline && (
        <div className="bg-[#FEF6EE] border-b border-[#F9DBAF] text-[#B54708] text-xs py-1.5 px-4 flex items-center justify-center space-x-2 select-none transition-all shadow-subtle">
          <WifiOff className="w-3.5 h-3.5 text-[#B54708] shrink-0" />
          <span>{t('offlineBannerDesc', 'Offline Mode • Displaying previously cached field and weather telemetry.')}</span>
        </div>
      )}

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      {/* Visible, thumb-friendly, with visible text labels (Not icon-only) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F4]/95 backdrop-blur-lg border-t border-[#E8E2D8] px-2 py-1.5 flex items-center justify-around shadow-floating"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const isActive = currentRoute === item.id || (item.id === 'fields' && currentRoute === 'field-detail');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#1B4D3E] font-bold'
                  : 'text-[#786C60] hover:text-[#1C1510]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#E8F5F0]' : 'bg-transparent'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] font-sans tracking-tight mt-0.5">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { useLanguage } from '../context/LanguageContext';
import { offlineCache } from '../services/offlineCache';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const NetworkIndicator: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isOnline, isSyncing, lastSyncTime } = useNetwork();
  const { t } = useLanguage();

  const formattedTime = offlineCache.formatTime(lastSyncTime);
  const titleText = lastSyncTime
    ? `${t('lastUpdated', 'Last updated')}: ${formattedTime}`
    : isOnline
    ? t('online', 'Online')
    : t('offline', 'Offline');

  if (isSyncing) {
    return (
      <div
        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-mono font-semibold text-sky-800 transition-all select-none"
        title={titleText}
      >
        <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
        <span className="hidden xs:inline">{t('syncing', 'Syncing...')}</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FEF6EE] border border-[#F9DBAF] text-[11px] font-mono font-bold text-[#B54708] shadow-subtle transition-all select-none"
        title={titleText}
      >
        <WifiOff className="w-3.5 h-3.5 text-[#B54708] shrink-0" />
        <span>{t('offlineCached', 'Offline • Cached')}</span>
      </div>
    );
  }

  // Online state: quiet, unobtrusive
  return (
    <div
      className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#E8F5F0] border border-[#BEE9DC] text-[11px] font-mono font-medium text-[#1B4D3E] select-none"
      title={titleText}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
      <span>{t('online', 'Online')}</span>
      {variant === 'full' && formattedTime && (
        <span className="text-[10px] text-[#2C6E59] opacity-80">({formattedTime})</span>
      )}
    </div>
  );
};

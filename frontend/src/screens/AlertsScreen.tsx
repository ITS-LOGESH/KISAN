import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { FarmerAlert, Field, AlertSeverity } from '../types';
import {
  localizeAlertSeverity,
  localizeAlertType,
  localizeAlertTitle,
  localizeAlertMessage,
  localizeAlertSource,
  localizeAlertAction
} from '../utils/i18n';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { LoadingSkeleton } from '../design-system/LoadingSkeleton';
import { ErrorState } from '../design-system/ErrorState';
import {
  Bell,
  CheckCheck,
  Check,
  ChevronRight,
  Filter,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
  X,
  ShieldCheck,
  Database
} from 'lucide-react';

export const AlertsScreen: React.FC = () => {
  const { navigate, params } = useRouter();
  const { t } = useLanguage();

  const [alerts, setAlerts] = useState<FarmerAlert[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [selectedFieldId, setSelectedFieldId] = useState<number | 'all'>('all');

  // Modal detail view
  const [selectedAlert, setSelectedAlert] = useState<FarmerAlert | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedAlerts, fetchedFields] = await Promise.all([
        api.getAlerts({ evaluate: false }).catch(() => []),
        api.getFields(false).catch(() => []),
      ]);
      setAlerts(fetchedAlerts);
      setFields(fetchedFields);

      // If route params specified a fieldId, filter to that field
      if (params?.fieldId) {
        setSelectedFieldId(params.fieldId);
      }
    } catch (err: any) {
      console.error('Failed to load alerts:', err);
      setError(t('failedToLoadAlerts', 'Failed to load farmer alerts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkRead = async (alert: FarmerAlert, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await api.markAlertRead(alert.id);
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a));
      if (selectedAlert && selectedAlert.id === alert.id) {
        setSelectedAlert(prev => prev ? { ...prev, is_read: true } : null);
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const fieldIdParam = selectedFieldId !== 'all' ? selectedFieldId : undefined;
      await api.markAllAlertsRead(fieldIdParam);
      setAlerts(prev => prev.map(a => {
        if (fieldIdParam !== undefined && a.field_id !== fieldIdParam) return a;
        return { ...a, is_read: true };
      }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterMode === 'unread' && a.is_read) return false;
    if (selectedFieldId !== 'all' && a.field_id !== selectedFieldId) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
            <AlertTriangle className="w-3 h-3 text-[#D92D20]" />
            <span>{localizeAlertSeverity('warning', t)}</span>
          </span>
        );
      case 'attention':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
            <AlertTriangle className="w-3 h-3 text-[#F79009]" />
            <span>{localizeAlertSeverity('attention', t)}</span>
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0F9FF] text-[#026AA2] border border-[#B9E6FE]">
            <Info className="w-3 h-3 text-[#0BA5EC]" />
            <span>{localizeAlertSeverity('info', t)}</span>
          </span>
        );
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-4">
        <LoadingSkeleton className="h-10 w-48" />
        <LoadingSkeleton className="h-14 w-full rounded-2xl" />
        <div className="space-y-3">
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
          <LoadingSkeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAlerts} />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* ================= SCREEN HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1510] tracking-tight">
              {t('farmerAlerts', 'Farmer Alerts')}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B54708] text-white">
                {unreadCount} {t('unread', 'Unread')}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#786C60] font-light mt-0.5">
            {t('fieldAlertsDesc', 'Real-time sensor, weather, and satellite notifications for your parcels.')}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<CheckCheck className="w-4 h-4 text-[#1B4D3E]" />}
            className="self-start sm:self-auto cursor-pointer"
          >
            {t('markAllRead', 'Mark all as read')}
          </Button>
        )}
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8E2D8] shadow-subtle text-xs">
        {/* All vs Unread Filter Tabs */}
        <div className="flex items-center bg-[#FAF8F4] p-1 rounded-xl border border-[#E8E2D8]">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-[#1C1510] shadow-subtle'
                : 'text-[#786C60] hover:text-[#1C1510]'
            }`}
          >
            {t('filterAll', 'All')} ({alerts.length})
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'unread'
                ? 'bg-white text-[#1C1510] shadow-subtle'
                : 'text-[#786C60] hover:text-[#1C1510]'
            }`}
          >
            {t('filterUnread', 'Unread Only')} ({unreadCount})
          </button>
        </div>

        {/* Field Selector Filter */}
        {fields.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-[#786C60] font-mono text-[11px] uppercase tracking-wider">{t('fields', 'Field')}:</span>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#FAF8F4] border border-[#E8E2D8] text-[#1C1510] rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] cursor-pointer"
            >
              <option value="all">{t('allFieldsCount', 'All Fields')}</option>
              {fields.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop_type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ================= ALERTS LIST ================= */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-8 text-center bg-white rounded-3xl border border-[#E8E2D8] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E8F5F0] text-[#1B4D3E] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[#1B4D3E]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif font-bold text-xl text-[#1C1510]">
              {filterMode === 'unread' ? t('allRead', 'All Clear!') : t('noActiveAlerts', 'No active alerts')}
            </h3>
            <p className="text-xs sm:text-sm text-[#786C60] leading-relaxed">
              {t('noActiveAlertsDesc', 'All monitored environmental indicators and crop conditions are within normal limits.')}
            </p>
          </div>
          {filterMode === 'unread' && alerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterMode('all')}
              className="cursor-pointer"
            >
              {t('viewAllAlerts', 'View All Alerts')} ({alerts.length})
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`group bg-white rounded-2xl border transition-all p-4 sm:p-5 cursor-pointer relative ${
                alert.is_read
                  ? 'border-[#E8E2D8] hover:border-[#1B4D3E]/40 hover:shadow-subtle opacity-90'
                  : 'border-[#C78520]/40 bg-gradient-to-r from-white via-white to-[#FEFDF9] shadow-subtle hover:border-[#C78520]'
              }`}
            >
              {/* Unread Indicator Bar */}
              {!alert.is_read && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#C78520] rounded-r-full" />
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Top Tags: Severity + Field Name + Time */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {getSeverityBadge(alert.severity)}

                    {alert.field_name && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5C4535] bg-[#FAF8F4] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                        <Layers className="w-3 h-3 text-[#1B4D3E]" />
                        <span className="font-semibold">{alert.field_name}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[11px] text-[#786C60] font-mono ml-auto">
                      <Clock className="w-3 h-3 text-[#786C60]" />
                      <span>{formatTimestamp(alert.created_at)}</span>
                    </span>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#1C1510] tracking-tight group-hover:text-[#1B4D3E] transition-colors">
                      {localizeAlertTitle(alert, t)}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5C4535] font-light leading-relaxed mt-1 line-clamp-2">
                      {localizeAlertMessage(alert, t)}
                    </p>
                  </div>

                  {/* Source & Action summary */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#786C60]">
                    <span className="font-mono">
                      {t('source', 'Source')}: <strong className="text-[#1C1510] font-semibold">{localizeAlertSource(alert.source, t)}</strong>
                    </span>
                    {alert.action && (
                      <>
                        <span>•</span>
                        <span className="text-[#1B4D3E] font-medium flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#1B4D3E]" />
                          <span className="line-clamp-1">{localizeAlertAction(alert, t)}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center space-x-1 shrink-0 self-center">
                  {!alert.is_read && (
                    <button
                      onClick={(e) => handleMarkRead(alert, e)}
                      title={t('markAsRead', 'Mark as read')}
                      className="p-1.5 text-[#786C60] hover:text-[#1B4D3E] hover:bg-[#FAF8F4] rounded-full transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#786C60] group-hover:text-[#1C1510] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= ALERT DETAILS MODAL ================= */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E8E2D8] shadow-elevated p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E2D8] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(selectedAlert.severity)}
                  <span className="text-xs font-mono text-[#786C60]">
                    {localizeAlertType(selectedAlert.type, t)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1510] tracking-tight">
                  {localizeAlertTitle(selectedAlert, t)}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-full text-[#786C60] hover:text-[#1C1510] hover:bg-[#FAF8F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Sections */}
            <div className="space-y-5 text-xs sm:text-sm">
              {/* Parcel Context */}
              {selectedAlert.field_name && (
                <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#E8E2D8] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#1B4D3E]" />
                    <span className="font-semibold text-[#1C1510]">{selectedAlert.field_name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      navigate('field-detail', { fieldId: selectedAlert.field_id });
                    }}
                    className="text-[#1B4D3E] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{t('viewField', 'View Field')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* What Happened */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#786C60] font-semibold block">
                  {t('whatHappened', 'WHAT HAPPENED')}
                </span>
                <p className="text-[#1C1510] leading-relaxed font-light text-sm sm:text-base">
                  {localizeAlertMessage(selectedAlert, t)}
                </p>
              </div>

              {/* Recommended Action */}
              {selectedAlert.action && (
                <div className="space-y-1.5 p-4 bg-[#E8F5F0] rounded-2xl border border-[#BEE9DC]">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#1B4D3E] font-bold block flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
                    {t('recommendedAction', 'RECOMMENDED ACTION')}
                  </span>
                  <p className="text-[#0F2F26] leading-relaxed font-medium">
                    {localizeAlertAction(selectedAlert, t)}
                  </p>
                </div>
              )}

              {/* Real Data Provenance */}
              <div className="space-y-1.5 pt-2 border-t border-[#E8E2D8]">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#786C60] font-semibold block flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#786C60]" />
                  {t('dataProvenance', 'DATA PROVENANCE & REAL SENSORS')}
                </span>
                <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#E8E2D8] space-y-1 text-xs text-[#5C4535]">
                  <div>
                    {t('source', 'Source')}: <strong className="text-[#1C1510]">{localizeAlertSource(selectedAlert.source, t)}</strong>
                  </div>
                  {selectedAlert.data_provenance && (
                    <div className="text-[11px] text-[#786C60] font-mono">
                      {selectedAlert.data_provenance}
                    </div>
                  )}
                  <div className="text-[11px] text-[#786C60] font-mono">
                    {t('observed', 'Observed')}: {formatTimestamp(selectedAlert.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E8E2D8]">
              {!selectedAlert.is_read ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkRead(selectedAlert)}
                  icon={<Check className="w-4 h-4 text-[#1B4D3E]" />}
                  className="cursor-pointer"
                >
                  {t('markAsRead', 'Mark as read')}
                </Button>
              ) : (
                <span className="text-xs text-[#786C60] font-mono flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#1B4D3E]" />
                  {t('read', 'Read')}
                </span>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedAlert(null)}
                className="cursor-pointer"
              >
                {t('close', 'Close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

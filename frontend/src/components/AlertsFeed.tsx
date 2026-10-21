import React, { useState, useEffect } from 'react';
import { Bell, Clock, Sparkles, AlertOctagon, CheckCheck, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { AlertItem } from '../types';
import { fetchAlerts, markAlertAsRead } from '../services/api';

interface AlertsFeedProps {
  onSelectNotice?: (noticeId: number) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ onSelectNotice }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts(filterType === 'all' ? undefined : filterType);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterType]);

  const handleMarkRead = async (alertId: number) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'deadline_revision':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'new_opportunity':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'status_withdrawn':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Transparency Guarantee Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-cyan-300">Deduplicated Change Guarantee: </span>
          ScholarTrack prevents alert spam by indexing unique deadline revision keys (<code className="text-cyan-400 font-mono text-[11px]">alert_deadline_rev_&#123;id&#125;_&#123;timestamp&#125;</code>).
          Repeated collection runs will never generate duplicate alerts for the same announcement revision.
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101B37] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 mr-2 font-medium">Filter:</span>
          {['all', 'deadline_revision', 'new_opportunity', 'status_withdrawn'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                filterType === t
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t === 'all' ? 'All Alerts' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={loadAlerts}
          disabled={loading}
          className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
          Loading recent change alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-16 text-center bg-[#101B37] rounded-xl border border-slate-800 p-8">
          <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h4 className="text-slate-200 font-semibold mb-1">No Alerts Detected</h4>
          <p className="text-xs text-slate-400">
            All tracked scholarship announcements are current with their published official sources.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.is_read
                  ? 'bg-[#0B132B]/60 border-slate-800/80 text-slate-400'
                  : 'bg-[#101B37] border-cyan-500/30 text-slate-200 shadow-md shadow-cyan-950/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/90 shrink-0 mt-0.5 border border-slate-700">
                    {getAlertIcon(alert.alert_type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                        {alert.alert_type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(alert.creation_timestamp).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 mt-0.5">
                      {alert.title}
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                      {alert.notice_title && onSelectNotice && (
                        <button
                          onClick={() => onSelectNotice(alert.notice_id)}
                          className="font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>Inspect Opportunity Details</span>
                          &rarr;
                        </button>
                      )}

                      {alert.canonical_url && (
                        <a
                          href={alert.canonical_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        >
                          <span>Official Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <span className="text-[11px] font-mono text-slate-500">
                        key: {alert.deduplication_key}
                      </span>
                    </div>
                  </div>
                </div>

                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

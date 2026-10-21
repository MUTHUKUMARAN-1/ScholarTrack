import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Lock, LogOut, 
  Settings, Database, FileText, Activity, AlertTriangle, Clock, ExternalLink 
} from 'lucide-react';
import { Source, CollectionRun, AuditLogItem, Notice } from '../types';
import { 
  getAuthUser, loginOperator, clearAuthToken, fetchSources, 
  triggerSourceRefresh, triggerRefreshAll, fetchAllRuns, fetchAuditLogs, 
  updateNoticeStatus, manualReviseDeadline, fetchNotices 
} from '../services/api';

export const OperatorDashboard: React.FC = () => {
  const [user, setUser] = useState(getAuthUser());
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Operator Data
  const [activeTab, setActiveTab] = useState<'sources' | 'runs' | 'moderation' | 'audit'>('sources');
  const [sources, setSources] = useState<Source[]>([]);
  const [runs, setRuns] = useState<CollectionRun[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Manual Revision State
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [revisedDate, setRevisedDate] = useState<string>('');
  const [revisedTimezone, setRevisedTimezone] = useState<string>('America/New_York');
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [revising, setRevising] = useState<boolean>(false);

  const loadAllData = async () => {
    if (!user.token) return;
    setLoading(true);
    setActionSuccess(null);
    try {
      const [srcData, runsData, auditData, notData] = await Promise.all([
        fetchSources(),
        fetchAllRuns(),
        fetchAuditLogs(),
        fetchNotices({ page_size: 50 }),
      ]);
      setSources(srcData);
      setRuns(runsData);
      setAuditLogs(auditData);
      setNotices(notData.items);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.token) {
      loadAllData();
    }
  }, [user.token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await loginOperator(username, password);
      setUser({ token: res.access_token, username: res.username, role: res.role });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser({ token: null, username: null, role: null });
  };

  const handleRefreshSource = async (sourceId: number) => {
    setLoading(true);
    setActionSuccess(null);
    try {
      const run = await triggerSourceRefresh(sourceId, false);
      setActionSuccess(`Refresh executed. Run status: ${run.status}. Records processed: ${run.records_processed}.`);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    setActionSuccess(null);
    try {
      const runList = await triggerRefreshAll(false);
      setActionSuccess(`Refreshed ${runList.length} sources successfully.`);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (noticeId: number, newStatus: string) => {
    try {
      await updateNoticeStatus(noticeId, newStatus, `Operator status update to ${newStatus}`);
      setActionSuccess(`Notice #${noticeId} marked as ${newStatus}.`);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleManualDeadlineRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNoticeId || !revisedDate || !revisionReason) {
      alert('Please select a notice, provide a date, and specify an operator reason.');
      return;
    }
    setRevising(true);
    try {
      await manualReviseDeadline(selectedNoticeId, revisedDate, revisionReason);
      setActionSuccess(`Deadline revised successfully for Notice #${selectedNoticeId}. Deduplicated alert and change history generated.`);
      setRevisedDate('');
      setRevisionReason('');
      setSelectedNoticeId(null);
      await loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevising(false);
    }
  };

  // Login View if not authenticated
  if (!user.token) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-[#101B37] rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Operator Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access protected collection management, audits, and source verification.
          </p>
        </div>

        {loginError && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Operator Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            Set the operator credentials in <code>backend/.env</code> before logging in.
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Authenticate as Operator
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operator Header Bar */}
      <div className="bg-[#101B37] p-5 rounded-2xl border border-[#1E2D58] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Operator Command Center</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <span className="text-slate-200 font-semibold">{user.username}</span>. Live monitoring & source governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-950"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh All Sources
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        {[
          { key: 'sources', label: 'Approved Sources', icon: Database },
          { key: 'moderation', label: 'Verification & Revisions', icon: FileText },
          { key: 'runs', label: 'Collection Runs & Errors', icon: Activity },
          { key: 'audit', label: 'Audit Trail', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === t.key
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sources */}
      {activeTab === 'sources' && (
        <div className="bg-[#101B37] rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">Registered Announcement Sources</h3>
            <span className="text-xs text-slate-400">{sources.length} active adapters</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0B132B] text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Source Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Permission</th>
                  <th className="px-4 py-3">Last Checked</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Records</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      <div>{src.name}</div>
                      <a
                        href={src.official_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 mt-0.5"
                      >
                        <span className="truncate max-w-[200px]">{src.official_url}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                    <td className="px-4 py-3 uppercase font-mono text-[11px] text-slate-400">
                      {src.source_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                        {src.permission_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {src.last_checked ? new Date(src.last_checked).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        src.last_status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        src.last_status === 'error' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {src.last_status}
                      </span>
                      {src.last_error && (
                        <p className="text-[10px] text-rose-400 mt-1 max-w-[180px] truncate" title={src.last_error}>
                          {src.last_error}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {src.records_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRefreshSource(src.id)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/30 transition-all font-semibold"
                      >
                        Refresh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Verification & Manual Revisions */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Moderation */}
          <div className="bg-[#101B37] rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Verify / Flag Announcements</span>
            </h3>
            <p className="text-xs text-slate-400">
              Update announcement status to verified, flagged, stale, or withdrawn.
            </p>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {notices.map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <h5 className="font-semibold text-slate-200 truncate">{n.title}</h5>
                    <p className="text-[11px] text-slate-400">{n.provider} &bull; Current: <span className="capitalize font-medium text-cyan-300">{n.notice_status}</span></p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStatusChange(n.id, 'verified')}
                      className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 text-[11px]"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleStatusChange(n.id, 'stale')}
                      className="px-2 py-1 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-[11px]"
                    >
                      Stale
                    </button>
                    <button
                      onClick={() => handleStatusChange(n.id, 'withdrawn')}
                      className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/40 text-[11px]"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Deadline Revision Tool */}
          <div className="bg-[#101B37] rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Operator Deadline Revision Tool</span>
            </h3>
            <p className="text-xs text-slate-400">
              Correct a deadline directly. The system automatically creates a timestamped 
              <span className="text-cyan-300 font-semibold"> ChangeHistory</span> entry and fires a single deduplicated revision alert.
            </p>

            <form onSubmit={handleManualDeadlineRevision} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Announcement</label>
                <select
                  value={selectedNoticeId || ''}
                  onChange={(e) => setSelectedNoticeId(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                >
                  <option value="">Select an opportunity...</option>
                  {notices.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.id} - {n.title} (Current: {n.deadline_raw_text || 'Rolling'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">New Application Deadline (ISO / UTC Date)</label>
                <input
                  type="datetime-local"
                  value={revisedDate}
                  onChange={(e) => setRevisedDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Timezone</label>
                <select
                  value={revisedTimezone}
                  onChange={(e) => setRevisedTimezone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="America/New_York">America/New_York (Eastern Time)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="UTC">UTC (Greenwich)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Audited Operator Reason (Mandatory)</label>
                <textarea
                  placeholder="e.g. Official sponsor announced 2-week deadline extension on official notice bulletin."
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={revising}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2"
              >
                {revising ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Submit Audited Deadline Revision
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Collection Runs */}
      {activeTab === 'runs' && (
        <div className="bg-[#101B37] rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">Collection Runs & Diagnostics</h3>
            <span className="text-xs text-slate-400">{runs.length} recorded runs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0B132B] text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Start Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Processed</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Diagnostic Information</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-cyan-400">#{r.id}</td>
                    <td className="px-4 py-3 font-sans text-slate-200 font-medium">{r.source_name}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(r.start_time).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                        r.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                        r.status === 'failed' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' :
                        'bg-amber-950 text-amber-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.records_processed}</td>
                    <td className="px-4 py-3 text-emerald-400">+{r.records_added}</td>
                    <td className="px-4 py-3 text-cyan-400">~{r.records_updated}</td>
                    <td className="px-4 py-3 font-sans text-slate-300 max-w-[280px] truncate" title={r.diagnostic_info || ''}>
                      {r.diagnostic_info || 'Completed with no errors.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#101B37] rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">Administrative Audit Trail</h3>
            <span className="text-xs text-slate-400">{auditLogs.length} audit records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#0B132B] text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                    <td className="px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-cyan-400 font-bold">{log.username}</td>
                    <td className="px-4 py-3 text-slate-200">{log.action}</td>
                    <td className="px-4 py-3 text-slate-400 uppercase">{log.target_entity} {log.target_id ? `#${log.target_id}` : ''}</td>
                    <td className="px-4 py-3 font-sans text-slate-300 max-w-[320px] truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Clock, Calendar, CheckCircle2, AlertTriangle, 
  RefreshCw, Award, BookOpen, MapPin, GraduationCap, ArrowUpDown, 
  ExternalLink, ShieldCheck, Sparkles, AlertOctagon 
} from 'lucide-react';

import { Notice, DashboardStats } from './types';
import { fetchNotices, fetchDashboardStats, fetchAlerts, fetchSources } from './services/api';
import { Navbar } from './components/Navbar';
import { NoticeCard } from './components/NoticeCard';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { AlertsFeed } from './components/AlertsFeed';
import { OperatorDashboard } from './components/OperatorDashboard';
import { StudentEligibilitySection } from './components/StudentEligibilitySection';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('opportunities');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(0);
  const [sourcesHealthy, setSourcesHealthy] = useState<boolean>(true);

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('all');
  const [discipline, setDiscipline] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');
  const [noticeType, setNoticeType] = useState<string>('all');
  const [noticeStatus, setNoticeStatus] = useState<string>('all');
  const [deadlineStatus, setDeadlineStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline_asc');

  // Selected Notice for Detail Modal
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, noticesRes, alertsRes, sourcesRes] = await Promise.all([
        fetchDashboardStats(),
        fetchNotices({
          search,
          education_level: educationLevel,
          discipline,
          region,
          notice_type: noticeType,
          notice_status: noticeStatus,
          deadline_status: deadlineStatus,
          sort_by: sortBy,
          page_size: 24,
        }),
        fetchAlerts(),
        fetchSources(),
      ]);

      setStats(statsRes);
      setNotices(noticesRes.items);
      setUnreadAlertCount(alertsRes.filter((a) => !a.is_read).length);

      const anyError = sourcesRes.some((s) => s.last_status === 'error');
      setSourcesHealthy(!anyError);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to ScholarTrack API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, educationLevel, discipline, region, noticeType, noticeStatus, deadlineStatus, sortBy]);

  const handleClearFilters = () => {
    setSearch('');
    setEducationLevel('all');
    setDiscipline('all');
    setRegion('all');
    setNoticeType('all');
    setNoticeStatus('all');
    setDeadlineStatus('all');
    setSortBy('deadline_asc');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadAlertCount={unreadAlertCount}
        sourcesHealthy={sourcesHealthy}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Metric Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-[#101B37] p-4 rounded-2xl border border-[#1E2D58] shadow-md shadow-black/20">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Opportunities</span>
                <Award className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats.total_opportunities}</div>
              <p className="text-[11px] text-slate-400 mt-1">Across approved public sources</p>
            </div>

            <div className="bg-[#101B37] p-4 rounded-2xl border border-[#1E2D58] shadow-md shadow-black/20">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Upcoming Deadlines</span>
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-300">{stats.upcoming_deadlines}</div>
              <p className="text-[11px] text-slate-400 mt-1">Active future closing dates</p>
            </div>

            <div className="bg-[#101B37] p-4 rounded-2xl border border-[#1E2D58] shadow-md shadow-black/20">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Closing Soon</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">{stats.closing_soon}</div>
              <p className="text-[11px] text-amber-400/80 mt-1">Deadlines within 30 days</p>
            </div>

            <div className="bg-[#101B37] p-4 rounded-2xl border border-[#1E2D58] shadow-md shadow-black/20">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Recently Updated</span>
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{stats.recently_updated}</div>
              <p className="text-[11px] text-slate-400 mt-1">Revisions in last 7 days</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-[#101B37] p-4 rounded-2xl border border-[#1E2D58] shadow-md shadow-black/20">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Source Freshness</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stats.sources_count} Sources Monitored</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {stats.last_collection_timestamp
                  ? `Checked ${new Date(stats.last_collection_timestamp).toLocaleDateString()}`
                  : 'Automated background polling active'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Student Opportunities Dashboard */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            {/* Search and Filters Section */}
            <div className="bg-[#101B37] p-5 rounded-2xl border border-[#1E2D58] space-y-4 shadow-lg shadow-black/20">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by scholarship title, provider, field, keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 appearance-none font-medium"
                    >
                      <option value="deadline_asc">Deadline (Earliest First)</option>
                      <option value="deadline_desc">Deadline (Furthest First)</option>
                      <option value="updated_desc">Recently Updated</option>
                      <option value="title_asc">Title (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-facet Filter Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Study Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Levels</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="master">Master's</option>
                    <option value="doctoral">PhD / Doctoral</option>
                    <option value="postdoc">Postdoctoral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Discipline</label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Fields</option>
                    <option value="stem">STEM / Engineering</option>
                    <option value="humanities">Humanities / Arts</option>
                    <option value="social">Social Sciences</option>
                    <option value="medicine">Medicine / Health</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Regions</option>
                    <option value="germany">Germany / Europe</option>
                    <option value="united states">United States</option>
                    <option value="taiwan">Taiwan</option>
                    <option value="international">Global Mobility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notice Type</label>
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Types</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="grant">Grant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Deadline State</label>
                  <select
                    value={deadlineStatus}
                    onChange={(e) => setDeadlineStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Deadlines</option>
                    <option value="upcoming">Upcoming Only</option>
                    <option value="closing_soon">Closing Soon (&lt;30d)</option>
                    <option value="rolling">Rolling / Unspecified</option>
                    <option value="past">Past / Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Verification</label>
                  <select
                    value={noticeStatus}
                    onChange={(e) => setNoticeStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">All Statuses</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified</option>
                    <option value="stale">Awaiting Verification</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              {/* Active filters status */}
              {(search || educationLevel !== 'all' || discipline !== 'all' || region !== 'all' || noticeType !== 'all' || noticeStatus !== 'all' || deadlineStatus !== 'all') && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Filtered active criteria</span>
                  <button
                    onClick={handleClearFilters}
                    className="text-cyan-400 hover:text-cyan-300 font-medium underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>

            {/* Opportunities Cards Grid */}
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
                <p className="text-slate-400 text-sm">Querying verified scholarship announcements...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-center space-y-2">
                <AlertOctagon className="w-8 h-8 mx-auto text-rose-400" />
                <h4 className="font-bold text-sm">API Communication Error</h4>
                <p className="text-xs">{error}</p>
                <button
                  onClick={loadData}
                  className="px-4 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-slate-100 text-xs font-semibold mt-2"
                >
                  Retry
                </button>
              </div>
            ) : notices.length === 0 ? (
              <div className="py-20 text-center bg-[#101B37] rounded-2xl border border-slate-800 p-8 space-y-3">
                <Search className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                <h4 className="text-slate-200 font-bold text-base">No Matching Scholarship Announcements Found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try adjusting your search keywords, broadening your discipline or education filters, or selecting "All Deadlines".
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {notices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onSelect={(n) => setSelectedNoticeId(n.id)}
                    onCheckEligibility={(n) => {
                      setSelectedNoticeId(n.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upcoming Deadlines & Countdowns */}
        {activeTab === 'deadlines' && (
          <div className="space-y-6">
            <div className="bg-[#101B37] p-5 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>Timezone-Aware Deadlines & Countdowns</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified countdowns computed against local publisher timezones. Unknown or rolling deadlines are explicitly recognized.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {notices
                .filter((n) => n.deadline !== null)
                .map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onSelect={(n) => setSelectedNoticeId(n.id)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Tab 3: Student Eligibility Matcher */}
        {activeTab === 'eligibility' && (
          <StudentEligibilitySection
            notices={notices}
            onSelectNotice={(n) => setSelectedNoticeId(n.id)}
          />
        )}

        {/* Tab 4: Alerts & Revision History */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-[#101B37] p-5 rounded-2xl border border-cyan-500/30">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Scholarship Revision Alerts & Change Timeline</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of revised deadlines, updated benefit packages, and sponsor cancellations.
              </p>
            </div>

            <AlertsFeed onSelectNotice={(id) => setSelectedNoticeId(id)} />
          </div>
        )}

        {/* Tab 5: Operator Admin Command Center */}
        {activeTab === 'operator' && <OperatorDashboard />}
      </main>

      {/* Detail Modal */}
      {selectedNoticeId && (
        <NoticeDetailModal
          noticeId={selectedNoticeId}
          onClose={() => setSelectedNoticeId(null)}
        />
      )}

      {/* Professional Footer */}
      <footer className="border-t border-[#1E2D58] bg-[#070D1E] py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
              ST
            </div>
            <span>ScholarTrack &bull; Academic Scholarship & Fellowship Deadline Tracker</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-400 space-y-0.5">
            <p>Approved Public Sources: Fulbright U.S. Student Program &bull; DAAD Scholarship Database &bull; NSF GRFP</p>
            <p className="text-[10px] text-slate-500">
              Information collected from permitted public portals. Final eligibility must be verified on official announcement pages.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

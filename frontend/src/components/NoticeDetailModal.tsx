import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Calendar, Building, MapPin, GraduationCap, 
  BookOpen, ShieldCheck, History, Award, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw 
} from 'lucide-react';
import { NoticeDetail, EligibilityMatchResult } from '../types';
import { fetchNoticeDetail, evaluateNoticeEligibility } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { DeadlineBadge } from './DeadlineBadge';

interface NoticeDetailModalProps {
  noticeId: number | null;
  onClose: () => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({ noticeId, onClose }) => {
  const [detail, setDetail] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Student eligibility fit tester
  const [studentLevel, setStudentLevel] = useState<string>('masters');
  const [studentDiscipline, setStudentDiscipline] = useState<string>('');
  const [studentCitizenship, setStudentCitizenship] = useState<string>('');
  const [matching, setMatching] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<EligibilityMatchResult | null>(null);

  useEffect(() => {
    if (!noticeId) return;
    setLoading(true);
    setError(null);
    setMatchResult(null);

    fetchNoticeDetail(noticeId)
      .then((data) => setDetail(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [noticeId]);

  if (!noticeId) return null;

  const handleTestFit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeId) return;
    setMatching(true);
    try {
      const res = await evaluateNoticeEligibility(noticeId, {
        education_level: studentLevel,
        discipline: studentDiscipline,
        citizenship: studentCitizenship,
      });
      setMatchResult(res);
    } catch (err: any) {
      alert(err.message || 'Error matching eligibility');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-[#1E293B] max-w-4xl w-full rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-[#0B132B]/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {detail && <StatusBadge status={detail.notice_status} size="sm" />}
              {detail && (
                <DeadlineBadge
                  deadline={detail.deadline}
                  timezone={detail.timezone}
                  deadlineRawText={detail.deadline_raw_text}
                  daysRemaining={detail.days_remaining}
                  isClosingSoon={detail.is_closing_soon}
                />
              )}
              {detail?.is_demo && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-600/40">
                  Demo Record
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              {loading ? 'Loading Opportunity Details...' : detail?.title}
            </h2>

            {detail && (
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  <Building className="w-3.5 h-3.5" />
                  {detail.provider}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {detail.region}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {detail.education_level}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  {detail.discipline}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {loading && (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
              <p className="text-slate-400 text-sm">Retrieving verified scholarship specifications...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300">
              <p className="font-semibold">Unable to load details:</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Official Source Banner */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-900/40 text-cyan-400 border border-cyan-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-cyan-200">Source-Verified Announcement</h4>
                    <p className="text-xs text-cyan-300/80">
                      Collected from approved publisher: <span className="font-medium text-slate-200">{detail.source_name || detail.provider}</span>
                      {detail.source_last_checked && ` (Last checked: ${new Date(detail.source_last_checked).toLocaleString()})`}
                    </p>
                  </div>
                </div>

                <a
                  href={detail.canonical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 text-xs whitespace-nowrap shadow-md shadow-cyan-950"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Deadline & Timezone Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Application Deadline & Timezone</span>
                  </div>
                  <p className="text-slate-200 font-medium">
                    {detail.deadline ? new Date(detail.deadline).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    }) : 'Rolling Application / No Fixed Cutoff Date'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Canonical text: <span className="text-slate-300 font-mono text-xs">{detail.deadline_raw_text || 'Unspecified'}</span> (Native timezone: {detail.timezone})
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                    <Award className="w-4 h-4" />
                    <span>Award Type & Educational Level</span>
                  </div>
                  <p className="text-slate-200 font-medium capitalize">
                    {detail.notice_type} &bull; {detail.education_level}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Applicable disciplines: <span className="text-slate-300">{detail.discipline}</span>
                  </p>
                </div>
              </div>

              {/* Benefits */}
              {detail.benefit_text && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h4 className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    Funding & Award Benefits
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                    {detail.benefit_text}
                  </p>
                </div>
              )}

              {/* Eligibility Criteria */}
              {detail.eligibility_text && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h4 className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    Published Eligibility Requirements
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-xs sm:text-sm mb-3">
                    {detail.eligibility_text}
                  </p>

                  {detail.eligibility_tags && detail.eligibility_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                      {detail.eligibility_tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Student Eligibility Matcher */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#111C3D] to-[#0A1227] border border-cyan-500/30 shadow-lg">
                <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Check Your Profile Fit</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Compare your academic profile against published keywords.
                </p>

                <form onSubmit={handleTestFit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Study Level</label>
                    <select
                      value={studentLevel}
                      onChange={(e) => setStudentLevel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="undergraduate">Undergraduate</option>
                      <option value="masters">Master's</option>
                      <option value="phd">PhD / Doctoral</option>
                      <option value="postdoc">Postdoctoral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Discipline</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, STEM"
                      value={studentDiscipline}
                      onChange={(e) => setStudentDiscipline(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Citizenship</label>
                    <input
                      type="text"
                      placeholder="e.g. United States, India, Germany"
                      value={studentCitizenship}
                      onChange={(e) => setStudentCitizenship(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={matching}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      {matching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Evaluate Profile Match
                    </button>
                  </div>
                </form>

                {matchResult && (
                  <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-700/80 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-xs">Estimated Keyword Alignment:</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        matchResult.match_score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                        matchResult.match_score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}>
                        {matchResult.match_score}% Match
                      </span>
                    </div>

                    {matchResult.matched_criteria.length > 0 && (
                      <div>
                        <p className="text-xs text-emerald-400 font-medium mb-1">Aligned Criteria:</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                          {matchResult.matched_criteria.map((c, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {matchResult.potential_conflicts.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-400 font-medium mb-1">Review Official Guidelines For:</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                          {matchResult.potential_conflicts.map((c, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mandatory Disclaimer */}
                    <div className="p-2.5 rounded bg-amber-950/40 border border-amber-600/30 text-amber-300/90 text-xs">
                      <p className="italic">{matchResult.disclaimer}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Change History Timeline */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    <span>Revision History & Deadline Changes</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {detail.change_history_count} recorded revision{detail.change_history_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {detail.change_history && detail.change_history.length > 0 ? (
                  <div className="space-y-3 relative pl-4 border-l-2 border-slate-800 ml-2">
                    {detail.change_history.map((h) => (
                      <div key={h.id} className="relative pb-2">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-[#0F172A]" />
                        <div className="text-xs font-semibold text-slate-200">
                          {new Date(h.detected_timestamp).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Source reference: {h.source_reference || 'Automated collector detection'}
                        </p>
                        {h.changed_fields?.deadline && (
                          <div className="mt-1.5 p-2 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                            <span className="text-rose-400 line-through mr-2">
                              Was: {h.changed_fields.deadline.old}
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              &rarr; Now: {h.changed_fields.deadline.new}
                            </span>
                          </div>
                        )}
                        {h.changed_fields?.operator_reason && (
                          <p className="text-xs text-cyan-300 mt-1 italic">
                            Reason: "{h.changed_fields.operator_reason}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">
                    No revisions recorded. Announcement details match original official posting.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B132B] flex items-center justify-between text-xs text-slate-400">
          <span>Identifier Hash: <span className="font-mono text-slate-300">{detail?.content_hash.slice(0, 16)}...</span></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

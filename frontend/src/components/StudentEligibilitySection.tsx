import React, { useState } from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, GraduationCap, Globe } from 'lucide-react';
import { Notice, EligibilityMatchResult } from '../types';
import { evaluateNoticeEligibility } from '../services/api';

interface StudentEligibilitySectionProps {
  notices: Notice[];
  onSelectNotice: (notice: Notice) => void;
}

export const StudentEligibilitySection: React.FC<StudentEligibilitySectionProps> = ({
  notices,
  onSelectNotice,
}) => {
  const [degreeLevel, setDegreeLevel] = useState<string>('masters');
  const [discipline, setDiscipline] = useState<string>('STEM');
  const [citizenship, setCitizenship] = useState<string>('United States');
  const [destination, setDestination] = useState<string>('Germany');

  const [results, setResults] = useState<EligibilityMatchResult[]>([]);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  const handleEvaluateAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      const matchPromises = notices.map((n) =>
        evaluateNoticeEligibility(n.id, {
          education_level: degreeLevel,
          discipline: discipline,
          citizenship: citizenship,
          study_country_interest: destination,
        })
      );
      const res = await Promise.all(matchPromises);
      // Sort by match score descending
      res.sort((a, b) => b.match_score - a.match_score);
      setResults(res);
    } catch (err: any) {
      alert(err.message || 'Evaluation error');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro & Transparency Callout */}
      <div className="bg-[#101B37] p-6 rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-950/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-100">Student Eligibility Preference Matcher</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Input your academic background and location preferences to compare your profile against published
              scholarship criteria. This matches criteria such as study level, academic discipline, and nationality requirements.
            </p>
            {/* Mandatory Disclaimers */}
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 mt-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-semibold">Transparency Disclaimer: </span>
                This automated evaluation provides guidance based purely on published keywords and announcements.
                <span className="font-semibold text-slate-100"> It does not guarantee official eligibility, admission, or award funding.</span>
                Always review the official sponsor guidelines and eligibility criteria on the verified provider website before applying.
              </div>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleEvaluateAll} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              Target Study Level
            </label>
            <select
              value={degreeLevel}
              onChange={(e) => setDegreeLevel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="undergraduate">Undergraduate (Bachelor's)</option>
              <option value="masters">Master's Degree</option>
              <option value="phd">Doctoral / PhD</option>
              <option value="postdoc">Postdoctoral Fellowship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Field / Academic Discipline
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Science, STEM, Arts"
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Citizenship / Nationality
            </label>
            <input
              type="text"
              placeholder="e.g. United States, India, Germany"
              value={citizenship}
              onChange={(e) => setCitizenship(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Target Destination Region
            </label>
            <input
              type="text"
              placeholder="e.g. Germany, USA, International"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={evaluating}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-950"
            >
              <Sparkles className="w-4 h-4" />
              {evaluating ? 'Evaluating Fit Across Opportunities...' : 'Evaluate Profile Compatibility'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-200">
              Evaluated Compatibility Ranked Results ({results.length} announcements)
            </h4>
            <span className="text-xs text-slate-400">Sorted by keyword alignment score</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((res) => {
              const notice = notices.find((n) => n.id === res.notice_id);
              if (!notice) return null;

              return (
                <div
                  key={res.notice_id}
                  className="bg-[#101B37] p-5 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        res.match_score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                        res.match_score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}>
                        {res.match_score}% Match Score
                      </span>
                      <span className="text-xs text-slate-400 truncate">{notice.provider}</span>
                    </div>

                    <h5
                      onClick={() => onSelectNotice(notice)}
                      className="font-bold text-sm text-slate-100 hover:text-cyan-300 cursor-pointer transition-colors mb-3"
                    >
                      {res.notice_title}
                    </h5>

                    {res.matched_criteria.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[11px] font-semibold text-emerald-400 mb-1">Aligned Elements:</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                          {res.matched_criteria.map((c, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {res.potential_conflicts.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] font-semibold text-amber-400 mb-1">Potential Criteria Differences:</p>
                        <ul className="text-xs space-y-1 text-slate-300">
                          {res.potential_conflicts.map((c, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-slate-400">
                      Deadline: {notice.deadline_raw_text || 'Rolling'}
                    </span>
                    <button
                      onClick={() => onSelectNotice(notice)}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <span>View Specifications</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

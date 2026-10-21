import React from 'react';
import { ExternalLink, Building, GraduationCap, MapPin, Sparkles, BookOpen } from 'lucide-react';
import { Notice } from '../types';
import { StatusBadge } from './StatusBadge';
import { DeadlineBadge } from './DeadlineBadge';

interface NoticeCardProps {
  notice: Notice;
  onSelect: (notice: Notice) => void;
  onCheckEligibility?: (notice: Notice) => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice, onSelect, onCheckEligibility }) => {
  return (
    <div className="bg-[#101B37] border border-[#1E2D58] hover:border-cyan-500/50 transition-all duration-200 rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-black/20 hover:shadow-cyan-950/20 group">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <StatusBadge status={notice.notice_status} size="sm" />
          <DeadlineBadge
            deadline={notice.deadline}
            timezone={notice.timezone}
            deadlineRawText={notice.deadline_raw_text}
            daysRemaining={notice.days_remaining}
            isClosingSoon={notice.is_closing_soon}
          />
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(notice)}
          className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-2 mb-2"
        >
          {notice.title}
        </h3>

        {/* Provider */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
          <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{notice.provider}</span>
        </div>

        {/* Metadata Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
            <GraduationCap className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[140px]">{notice.education_level}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
            <BookOpen className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[140px]">{notice.discipline}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[140px]">{notice.region}</span>
          </span>
        </div>

        {/* Excerpt */}
        {notice.excerpt && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 bg-slate-900/60 p-2.5 rounded-md border border-slate-800/80 italic">
            "{notice.excerpt}"
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-auto">
        <button
          onClick={() => onSelect(notice)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all flex items-center gap-1"
        >
          Details & History
        </button>

        <div className="flex items-center gap-2">
          {onCheckEligibility && (
            <button
              onClick={() => onCheckEligibility(notice)}
              title="Test your eligibility against this opportunity"
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Check Fit
            </button>
          )}

          {/* Official Canonical Announcement Link */}
          <a
            href={notice.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open official verified announcement website"
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1 shrink-0"
          >
            <span>Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

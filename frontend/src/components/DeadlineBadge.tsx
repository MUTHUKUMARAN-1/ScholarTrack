import React from 'react';
import { Calendar, Clock, AlertTriangle, Infinity } from 'lucide-react';

interface DeadlineBadgeProps {
  deadline?: string | null;
  timezone: string;
  deadlineRawText?: string;
  daysRemaining?: number | null;
  isClosingSoon?: boolean;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({
  deadline,
  timezone,
  deadlineRawText,
  daysRemaining,
  isClosingSoon,
}) => {
  // If no deadline date is recorded
  if (!deadline) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 text-xs">
        <Infinity className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-medium">Rolling / Unspecified</span>
      </div>
    );
  }

  // Format date display
  const dateObj = new Date(deadline);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getTzAbbreviation = (tz: string) => {
    if (tz.includes('New_York')) return 'ET';
    if (tz.includes('Berlin')) return 'CET';
    if (tz.includes('London')) return 'BST/GMT';
    if (tz === 'UTC') return 'UTC';
    return tz.split('/').pop()?.replace('_', ' ') || tz;
  };

  const tzAbbrev = getTzAbbreviation(timezone);

  // Past deadline
  if (daysRemaining !== null && daysRemaining !== undefined && daysRemaining < 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-700 text-xs">
        <Clock className="w-3.5 h-3.5 text-zinc-500" />
        <span>Passed ({formattedDate})</span>
      </div>
    );
  }

  // Closing Soon (<30 days)
  if (isClosingSoon || (daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 30)) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/70 text-amber-300 border border-amber-500/40 text-xs shadow-sm shadow-amber-950/50">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-semibold">
          {daysRemaining === 0 ? 'Closes today!' : daysRemaining === 1 ? 'Closes tomorrow!' : `${daysRemaining} days left`}
        </span>
        <span className="text-amber-400/70 border-l border-amber-600/40 pl-1.5">
          {formattedDate} ({tzAbbrev})
        </span>
      </div>
    );
  }

  // Standard Upcoming
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs">
      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
      <span className="font-medium">{formattedDate}</span>
      <span className="text-cyan-400/60 border-l border-cyan-700/50 pl-1.5">
        {daysRemaining !== null && daysRemaining !== undefined ? `${daysRemaining}d` : ''} ({tzAbbrev})
      </span>
    </div>
  );
};

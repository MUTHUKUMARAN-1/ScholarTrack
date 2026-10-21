import React from 'react';
import { CheckCircle2, AlertCircle, Clock, AlertOctagon } from 'lucide-react';
import { NoticeStatus } from '../types';

interface StatusBadgeProps {
  status: NoticeStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs font-medium px-2.5 py-1 gap-1.5';

  switch (status) {
    case 'verified':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
          <CheckCircle2 className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Verified
        </span>
      );
    case 'unverified':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
          <AlertCircle className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Unverified
        </span>
      );
    case 'stale':
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 ${sizeClasses}`}>
          <Clock className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Awaiting Verification / Stale
        </span>
      );
    case 'withdrawn':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
          <AlertOctagon className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Withdrawn / Closed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

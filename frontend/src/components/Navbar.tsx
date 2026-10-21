import React from 'react';
import { Compass, Clock, Bell, Sparkles, ShieldCheck, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadAlertCount: number;
  sourcesHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadAlertCount,
  sourcesHealthy,
}) => {
  return (
    <header className="bg-[#0B132B]/95 backdrop-blur-md border-b border-[#1E2D58] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('opportunities')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-100 font-sans">
                  Scholar<span className="text-cyan-400">Track</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold tracking-wider">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-tight hidden sm:block">
                Scholarship & Fellowship Deadline Tracker
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'opportunities', label: 'Opportunities', icon: Compass },
              { id: 'deadlines', label: 'Upcoming Deadlines', icon: Clock },
              { id: 'eligibility', label: 'Eligibility Matcher', icon: Sparkles },
              { id: 'alerts', label: 'Alerts & History', icon: Bell, badge: unreadAlertCount },
              { id: 'operator', label: 'Operator Portal', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>

                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Health & Live Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sourcesHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${sourcesHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-slate-300">
              {sourcesHealthy ? 'Sources Verified' : 'Monitoring Stale'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

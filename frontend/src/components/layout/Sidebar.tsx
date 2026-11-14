import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FilePlus,
  Upload,
  PlayCircle,
  Users,
  Scale,
  MessageSquare,
  FileSearch,
  BarChart3,
  History,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
}

const navSections = [
  {
    title: 'Recruitment Intelligence',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { name: 'Job Postings', to: '/jobs', icon: Briefcase },
      { name: 'Create Job', to: '/jobs/new', icon: FilePlus },
      { name: 'Upload Resumes', to: '/resumes/upload', icon: Upload },
      { name: 'Screening Runs', to: '/screening', icon: PlayCircle },
    ]
  },
  {
    title: 'Candidate Evaluation',
    items: [
      { name: 'Candidate Scorecards', to: '/candidates', icon: Users },
      { name: 'Candidate Comparison', to: '/comparison', icon: Scale },
      { name: 'Interview Assistant', to: '/interviews', icon: MessageSquare },
      { name: 'Resume Quality Audit', to: '/quality-analyzer', icon: FileSearch },
    ]
  },
  {
    title: 'Analytics & Compliance',
    items: [
      { name: 'Pipeline Analytics', to: '/analytics', icon: BarChart3 },
      { name: 'Screening History', to: '/history', icon: History },
      { name: 'Settings & Privacy', to: '/settings', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-navy-950/80 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {sec.title}
            </h3>
            <div className="space-y-0.5">
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard' || item.to === '/jobs'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Decision-Support & Compliance Badge */}
      <div className="pt-4 border-t border-slate-800/60">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Responsible AI</span>
          </div>
          <p className="leading-relaxed text-[10px]">
            Decision-support mode active. Human recruiter oversight mandatory for all hiring outcomes.
          </p>
        </div>
      </div>
    </aside>
  );
};

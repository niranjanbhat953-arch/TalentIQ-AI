import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, User, Bell, PlusCircle, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-navy-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              TalentIQ <span className="text-brand-400">AI</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] tracking-wider uppercase text-slate-400 ml-2 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
              Decision Support
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/jobs/new"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5 text-brand-400" />
          <span>New Job</span>
        </Link>

        <Link
          to="/resumes/upload"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/25 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Resumes</span>
        </Link>

        <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-2">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.displayName || 'User'}
              className="w-8 h-8 rounded-full ring-2 ring-brand-500/30 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-900/60 border border-brand-500/30 flex items-center justify-center text-brand-300">
              <User className="w-4 h-4" />
            </div>
          )}

          <div className="hidden lg:block text-left text-xs">
            <p className="font-medium text-slate-200 leading-tight">
              {profile?.displayName || 'Recruiter'}
            </p>
            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
              {profile?.email || 'Authenticated'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

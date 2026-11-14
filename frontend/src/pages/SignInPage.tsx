import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Lock, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignInPage: React.FC = () => {
  const { signInWithGoogle, signInAsDemoRecruiter, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await signInAsDemoRecruiter();
      navigate(from, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Demo recruiter sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)]" />

      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              TalentIQ <span className="text-brand-400">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white pt-2">Recruiter Access Portal</h2>
          <p className="text-xs text-slate-400">
            Sign in with verified corporate credentials to access candidate dossiers and screening runs.
          </p>
        </div>

        {(localError || authError) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">
                  {(localError || authError)?.includes('unauthorized-domain')
                    ? 'Unauthorized Domain for Google Authentication'
                    : 'Authentication Failed'}
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {localError || authError}
                </p>
              </div>
            </div>

            {(localError || authError)?.includes('unauthorized-domain') && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px] text-slate-300 space-y-2">
                <p>
                  Current hostname: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">{window.location.hostname}</code>
                </p>
                {window.location.hostname === '127.0.0.1' ? (
                  <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-300">
                      Firebase allows <code className="text-emerald-400 font-mono">localhost</code> by default, but blocks IP address <code className="text-amber-400 font-mono">127.0.0.1</code> until manually added.
                    </p>
                    <a
                      href={`http://localhost:${window.location.port || '5173'}${window.location.pathname}${window.location.search}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md mt-1"
                    >
                      <span>Switch to http://localhost:{window.location.port || '5173'}</span>
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <p className="font-semibold text-slate-200">How to authorize this domain:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[11px]">
                      <li>Open <span className="text-brand-300">Firebase Console &gt; Authentication &gt; Settings</span></li>
                      <li>Select the <span className="text-brand-300">Authorized domains</span> tab</li>
                      <li>Click <span className="text-brand-300">Add domain</span> and enter <code className="text-amber-300">{window.location.hostname}</code></li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* Google Sign-in */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold text-slate-100 bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-brand-500/50 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.12 0-5.77-2.1-6.72-4.93H1.2v3.15C3.25 21.43 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.2C.44 8.1 0 9.99 0 12s.44 3.9 1.2 5.42l4.08-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.57 1.2 6.58l4.08 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-navy-900 px-2 text-[10px] uppercase font-semibold text-slate-400">
              Evaluation & Review
            </span>
          </div>

          {/* Quick Demo Sign-in */}
          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-brand-300 bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/30 transition-all disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 text-brand-400" />
            <span>Sign In as Demo Recruiter (Alex Turner)</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Trust Enterprise Authorization</span>
          </div>
          <p className="leading-relaxed">
            All session tokens are independently cryptographically verified by the TalentIQ backend on every request. Client user IDs are never trusted as proof of ownership.
          </p>
        </div>
      </div>
    </div>
  );
};

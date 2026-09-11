import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase is not configured yet. Please provide your Supabase URL and Anon Key.");
      return;
    }

    try {
      setLoading(true);
      // Use skipBrowserRedirect: true so the iframe does not try to navigate to Google directly (which Google blocks)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Google authorization directly in a popup window
        const width = 500;
        const height = 650;
        const left = Math.max(0, (window.screen.width - width) / 2);
        const top = Math.max(0, (window.screen.height - height) / 2);
        const popup = window.open(
          data.url,
          'google_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // If popup is blocked by the browser, fallback to navigating directly
          window.location.href = data.url;
          return;
        }

        // Poll for popup closure and check session
        const pollInterval = setInterval(async () => {
          if (popup.closed) {
            clearInterval(pollInterval);
            setLoading(false);
            if (supabase) {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                setSuccessMsg("Google authorization confirmed! Welcome.");
                setTimeout(() => {
                  onAuthSuccess?.();
                  onClose();
                }, 800);
              }
            }
          }
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with Google.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase is not configured yet. Please configure your project environment variables.");
      return;
    }

    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || 'Operative',
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMsg("Account created and signed in successfully!");
          setTimeout(() => {
            onAuthSuccess?.();
            onClose();
          }, 1000);
        } else {
          setSuccessMsg("Verification link dispatched! Please check your email to activate your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSuccessMsg("Authentication verified. Welcome back!");
        setTimeout(() => {
          onAuthSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-surface-container-low border border-outline-variant/40 p-6 md:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          type="button"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-1.5 text-primary text-[11px] font-label-sm uppercase tracking-widest font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>Security Protocol // Auth Gate</span>
          </div>
          <h2 className="font-headline-sm text-2xl text-on-surface font-normal">
            {mode === 'signin' ? 'Sign In to DEERHORN' : 'Register Operative Account'}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {mode === 'signin' 
              ? 'Access your telemetry profile, active loadouts, and dispatch history.'
              : 'Join the engineering matrix for priority batch allocations and firmware archives.'}
          </p>
        </div>

        {/* Missing Config Notification */}
        {!isSupabaseConfigured && (
          <div className="mb-5 p-3 rounded-lg bg-surface-container border border-primary/30 text-primary text-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">info</span>
            <div className="flex flex-col gap-0.5">
              <strong className="text-on-surface">Supabase Setup Required</strong>
              <span className="text-on-surface-variant">
                Configure <code className="text-primary font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="text-primary font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code> to enable live authentication.
              </span>
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/30 border border-error/40 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-secondary-container/40 border border-secondary/50 text-secondary text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg bg-surface-container-high border border-outline-variant/50 hover:border-primary hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-50"
          type="button"
        >
          {/* Official Google Vector Logo */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="mt-2 text-center text-[11px] text-on-surface-variant">
          Opens a secure Google authorization window.{' '}
          <a
            href="https://ais-dev-s343wkgvvihon43ilqj7c3-208845006562.asia-east1.run.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open in new tab ↗
          </a>
        </p>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-outline-variant/30"></div>
          <span className="absolute bg-surface-container-low px-3 font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
            Or with email credentials
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
                Operative Call-Sign / Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Commander Vance"
                className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3.5 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operative@domain.com"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3.5 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
              Passcode
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3.5 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold hover:bg-primary-fixed-dim transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
            )}
            <span>{mode === 'signin' ? 'Verify & Sign In' : 'Establish Operative Profile'}</span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center font-body-sm text-xs text-on-surface-variant">
          {mode === 'signin' ? (
            <span>
              Don't have an operative profile?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already possess an authenticated profile?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(null); }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import IntentClient from '@/components/intent/IntentClient';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  user?: { id?: string; email?: string; user_metadata?: { full_name?: string; name?: string }; app_metadata?: { provider?: string } };
};

const STORAGE_KEY = 'gic-loosemouth-session';

function normalizeSession(value: AuthSession): AuthSession {
  const expiresAt = value.expires_at || (value.expires_in ? Math.floor(Date.now() / 1000) + value.expires_in : undefined);
  return { ...value, expires_at: expiresAt };
}

async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  return normalizeSession(await response.json() as AuthSession);
}

export default function IntentAuthGate() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const oauthAccessToken = hash.get('access_token');
        const oauthRefreshToken = hash.get('refresh_token');
        const oauthExpiresIn = Number(hash.get('expires_in') || 0);
        if (oauthAccessToken && oauthRefreshToken) {
          const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${oauthAccessToken}`,
            },
          });
          const user = userResponse.ok ? await userResponse.json() as AuthSession['user'] : undefined;
          const oauthSession = normalizeSession({
            access_token: oauthAccessToken,
            refresh_token: oauthRefreshToken,
            expires_in: oauthExpiresIn || 3600,
            user,
          });
          persist(oauthSession);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          return;
        }

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw) as AuthSession;
        if (!stored.access_token || !stored.refresh_token) return;
        const now = Math.floor(Date.now() / 1000);
        if (stored.expires_at && stored.expires_at > now + 60) {
          if (active) setSession(stored);
          return;
        }
        const next = await refreshSession(stored.refresh_token);
        if (active) persist(next);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (active) setChecked(true);
      }
    }
    void restore();
    return () => { active = false; };
  }, [persist]);


  useEffect(() => {
    if (!session?.refresh_token || !session.expires_at) return;
    const delay = Math.max((session.expires_at * 1000) - Date.now() - 60_000, 10_000);
    const timer = window.setTimeout(async () => {
      const next = await refreshSession(session.refresh_token);
      persist(next);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session, persist]);

  function signInWithGoogle() {
    const redirectTo = `${window.location.origin}/intent`;
    const authorizeUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
    authorizeUrl.searchParams.set('provider', 'google');
    authorizeUrl.searchParams.set('redirect_to', redirectTo);
    window.location.assign(authorizeUrl.toString());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const endpoint = mode === 'signup'
        ? `${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(`${window.location.origin}/intent`)}`
        : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json() as AuthSession & { message?: string; error_description?: string; msg?: string };
      if (!response.ok) throw new Error(data.message || data.error_description || data.msg || 'Authentication failed.');

      if (data.access_token && data.refresh_token) {
        persist(normalizeSession(data));
        setPassword('');
        return;
      }

      if (mode === 'signup') {
        setNotice('Account created. Check your email to confirm your address, then sign in.');
        setMode('signin');
        setPassword('');
        return;
      }
      throw new Error('No session was returned.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const token = session?.access_token;
    persist(null);
    if (!token) return;
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Local session is already cleared.
    }
  }

  if (!checked) {
    return <main className="min-h-screen bg-[#090e1b]" aria-busy="true" />;
  }

  if (session?.access_token) {
    return (
      <IntentClient
        accessToken={session.access_token}
        accountEmail={session.user?.email || email}
        accountName={session.user?.user_metadata?.full_name || session.user?.user_metadata?.name}
        accountProvider={session.user?.app_metadata?.provider}
        onSignOut={signOut}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#090e1b] px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">LooseMouth · Research access</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">Sign in to use GIC-operated inference.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            LooseMouth is a public research interface for privately operated models. Accounts provide a stable usage boundary and help protect limited inference capacity from automated abuse.
          </p>
          <div className="mt-8 border-l border-sky-300/30 pl-5 text-sm leading-7 text-slate-400">
            <p>20 inference requests per account per rolling one-hour window.</p>
            <p>Your password is handled by Supabase Auth, not stored by Global Intent Company application code.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#10192a] p-6 shadow-2xl sm:p-8">
          <div className="flex rounded-lg bg-white/5 p-1">
            <button type="button" onClick={() => { setMode('signin'); setError(''); setNotice(''); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === 'signin' ? 'bg-white text-slate-950' : 'text-slate-300'}`}>Sign in</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setNotice(''); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-white text-slate-950' : 'text-slate-300'}`}>Create account</button>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
          >
            <span aria-hidden="true" className="text-base font-bold">G</span>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0b1425] px-3 py-3 text-white outline-none focus:border-sky-300" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Password</span>
              <input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0b1425] px-3 py-3 text-white outline-none focus:border-sky-300" />
            </label>
            <button disabled={busy} type="submit" className="w-full rounded-lg bg-sky-400 px-4 py-3 text-sm font-semibold text-[#071425] hover:bg-sky-300 disabled:opacity-50">
              {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">{notice}</p>}
          {error && <p role="alert" className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</p>}
        </section>
      </div>
    </main>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import IntentClient from '@/components/intent/IntentClient';
import IntentPwaControls from '@/components/intent/IntentPwaControls';
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
  const [showAuth, setShowAuth] = useState(false);

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

  function intentRedirectUrl() {
    const host = window.location.hostname;
    if (host === 'globalintentcompany.space' || host === 'www.globalintentcompany.space') {
      return 'https://globalintentcompany.space/intent';
    }
    return `${window.location.origin}/intent`;
  }

  function signInWithProvider(provider: 'google' | 'github' | 'azure') {
    const authorizeUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
    authorizeUrl.searchParams.set('provider', provider);
    authorizeUrl.searchParams.set('redirect_to', intentRedirectUrl());
    if (provider === 'azure') authorizeUrl.searchParams.set('scopes', 'openid email profile');
    window.location.assign(authorizeUrl.toString());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const endpoint = mode === 'signup'
        ? `${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(intentRedirectUrl())}`
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
    return <main className="min-h-screen bg-white" aria-busy="true" />;
  }

  if (session?.access_token) {
    return (
      <IntentClient
        accessToken={session.access_token}
        accountUserId={session.user?.id}
        accountEmail={session.user?.email || email}
        accountName={session.user?.user_metadata?.full_name || session.user?.user_metadata?.name}
        accountProvider={session.user?.app_metadata?.provider}
        onSignOut={signOut}
      />
    );
  }

  if (!showAuth) {
    return (
      <IntentClient
        accountName="Guest"
        onRequireAuth={() => setShowAuth(true)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
            <ArrowLeft size={16} /> Main site
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/research" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
              Research
            </Link>
            <Link href="/systems" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
              Systems <ExternalLink size={14} />
            </Link>
          </div>
        </nav>
      </div>
      <div className="mx-auto grid min-h-[78vh] max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-6 flex items-center gap-4">
            <Image
              src="/images/loosemouth-model-logo.png"
              alt="LooseMouth"
              width={1456}
              height={1080}
              priority
              sizes="88px"
              className="h-auto w-20"
            />
            <div>
              <p className="text-sm font-semibold text-slate-950">LooseMouth</p>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-700">INTENT model family</p>
            </div>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">LooseMouth · Research access</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Continue with a free account.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            You can try 5 guest messages before creating a free account. Signing in unlocks continued LooseMouth access, saved conversations, and a stable usage boundary.
          </p>
          <div className="mt-8 border-l border-blue-200 pl-5 text-sm leading-7 text-slate-500">
            <p>Guest access includes 5 messages. Authenticated accounts currently receive 20 inference requests per rolling one-hour window.</p>
            <p>Your password is handled by Supabase Auth. Hosted inference is currently provided through Groq while Global Intent Company develops private AI models and infrastructure.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button type="button" onClick={() => { setMode('signin'); setError(''); setNotice(''); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === 'signin' ? 'bg-white text-slate-950' : 'text-slate-600'}`}>Sign in</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setNotice(''); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-white text-slate-950' : 'text-slate-600'}`}>Create account</button>
          </div>

          <button
            type="button"
            onClick={() => signInWithProvider('google')}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
          >
            <span aria-hidden="true" className="text-base font-bold">G</span>
            Continue with Google
          </button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => signInWithProvider('github')} className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">Continue with GitHub</button>
            <button type="button" onClick={() => signInWithProvider('azure')} className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">Microsoft / Outlook</button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Yahoo addresses can continue with email today. Yahoo OAuth will appear here after a custom OIDC/OAuth provider is configured.</p>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-950 outline-none focus:border-blue-500" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-950 outline-none focus:border-blue-500" />
            </label>
            <button disabled={busy} type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
          {error && <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Install LooseMouth</p>
            <IntentPwaControls />
          </div>
        </section>
      </div>
    </main>
  );
}

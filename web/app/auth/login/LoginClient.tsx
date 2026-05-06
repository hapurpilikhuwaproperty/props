'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  BoltIcon,
  EnvelopeIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { getNextPathFromWindow } from '../../../lib/navigation';

type MfaChallenge = {
  challengeId: string;
  setupRequired: boolean;
  secret?: string;
  otpauthUrl?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const currentOrigin = () => (typeof window === 'undefined' ? undefined : window.location.origin);

function GoogleMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [passwordFallback, setPasswordFallback] = useState(false);
  const [mfa, setMfa] = useState<MfaChallenge | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState('/dashboard');
  const router = useRouter();
  const { login } = useAuth();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setNextPath(getNextPathFromWindow());
  }, []);

  const handleAuthResponse = (data: any) => {
    if (data?.mfaRequired) {
      setMfa({
        challengeId: data.challengeId,
        setupRequired: Boolean(data.setupRequired),
        secret: data.secret,
        otpauthUrl: data.otpauthUrl,
      });
      setError('');
      return;
    }
    login(data.user);
    router.push(nextPath);
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initializeGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            setLoading(true);
            const { data } = await api.post('/auth/google', { idToken: response.credential });
            handleAuthResponse(data);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Google login failed');
          } finally {
            setLoading(false);
          }
        },
      });
    };

    if (window.google) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [googleClientId, nextPath]);

  const continueWithEmail = async () => {
    const value = email.trim();
    setError('');
    setMagicSent(false);

    if (!value) {
      setError('Enter your email address');
      return;
    }
    if (!isEmail(value)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/start', { identifier: value, redirectUrl: currentOrigin() });
      if (data.flow === 'magic_link') {
        setPasswordFallback(Boolean(data.passwordFallback));
        setMagicSent(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign-in request failed');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    const value = email.trim();
    setError('');

    if (!value) {
      setError('Enter your email address');
      return;
    }
    if (!isEmail(value)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter your password');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: value, password });
      handleAuthResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async () => {
    if (!mfa) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/mfa/verify', { challengeId: mfa.challengeId, code: mfaCode });
      handleAuthResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const continueWithGoogle = () => {
    if (!googleClientId || !window.google) {
      setError('Google login is not configured yet');
      return;
    }
    window.google.accounts.id.prompt();
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 text-[#0f172a] md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1810px] overflow-hidden rounded-[26px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 md:grid-cols-[0.6fr_1fr]">
        <aside className="relative min-h-[660px] overflow-hidden bg-[#f7fbff] px-8 py-10 md:px-20 md:py-20">
          <div className="relative z-10 max-w-[410px]">
            <div className="inline-flex items-center gap-3 text-lg font-semibold text-[#0b3b9e]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8efff]">
                <LockClosedIcon className="h-5 w-5 text-brand" />
              </span>
              Secure & Trusted
            </div>

            <h1 className="mt-9 text-[44px] font-bold leading-[1.18] tracking-normal text-slate-950 md:text-[54px]">
              Find, Buy or Sell Properties with <span className="text-brand">Confidence</span>
            </h1>
            <p className="mt-7 max-w-[350px] text-xl leading-8 text-slate-600">
              Browse properties freely. Sign in to save favorites, contact sellers, or list your property.
            </p>

            <div className="mt-14 space-y-10">
              <div className="flex gap-5">
                <span className="inline-flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl bg-[#e8efff]">
                  <ShieldCheckIcon className="h-9 w-9 text-brand" />
                </span>
                <div>
                  <p className="text-lg font-bold">Secure Login</p>
                  <p className="mt-2 text-base leading-7 text-slate-600">Your data is protected with industry-standard security.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <span className="inline-flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl bg-[#e8efff]">
                  <UserIcon className="h-9 w-9 text-brand" />
                </span>
                <div>
                  <p className="text-lg font-bold">Role Based Access</p>
                  <p className="mt-2 text-base leading-7 text-slate-600">Different access for buyers, sellers and admins.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <span className="inline-flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl bg-[#e8efff]">
                  <BoltIcon className="h-9 w-9 text-brand" />
                </span>
                <div>
                  <p className="text-lg font-bold">Quick & Easy</p>
                  <p className="mt-2 text-base leading-7 text-slate-600">Sign in or create account in just a few seconds.</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute bottom-0 right-[-38px] h-[43%] w-[86%] bg-cover bg-bottom bg-no-repeat md:h-[38%] md:w-[88%]"
            // style={{
            //   backgroundImage:
            //     'linear-gradient(180deg, rgba(247,251,255,0) 0%, rgba(247,251,255,0.08) 100%), url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85)',
            // }}
          />
        </aside>

        <section className="flex items-center justify-center px-6 py-12 md:px-20">
          <div className="w-full max-w-[840px]">
            {mfa ? (
              <div className="mx-auto max-w-[620px] space-y-6">
                <div className="text-center">
                  <h2 className="text-[44px] font-bold tracking-normal text-slate-950">Admin verification</h2>
                  <p className="mt-3 text-lg text-slate-500">
                    {mfa.setupRequired ? 'Add this account to an authenticator app, then enter the code.' : 'Enter the code from your authenticator app.'}
                  </p>
                </div>
                {mfa.setupRequired && (
                  <div className="rounded-2xl border bg-slate-50 p-5 text-sm">
                    <p className="font-semibold">TOTP secret</p>
                    <p className="mt-2 break-all font-mono text-xs text-slate-700">{mfa.secret}</p>
                  </div>
                )}
                <input className="h-[72px] w-full rounded-xl border border-slate-300 px-6 text-xl outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="123456" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
                <button onClick={verifyMfa} disabled={loading} className="flex h-[84px] w-full items-center justify-center rounded-xl bg-brand text-xl font-semibold text-white shadow-[0_12px_24px_rgba(21,94,237,0.26)] disabled:opacity-60">
                  Verify admin login
                </button>
                {error && <p className="text-center text-sm text-red-600">{error}</p>}
              </div>
            ) : (
              <div className="mx-auto max-w-[835px]">
                {magicSent ? (
                  <div className="mx-auto max-w-[620px] space-y-7 text-center">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
                      <EnvelopeIcon className="h-8 w-8 text-brand" />
                    </span>
                    <div>
                      <h2 className="text-[44px] font-bold tracking-normal text-slate-950">Check your email</h2>
                      <p className="mt-3 text-lg leading-7 text-slate-500">We sent a secure magic link to {email}. It expires shortly and can be used once.</p>
                    </div>
                    <button onClick={continueWithEmail} disabled={loading} className="flex h-[72px] w-full items-center justify-center rounded-xl border border-slate-300 text-lg font-semibold text-slate-950 disabled:opacity-60">
                      {loading ? 'Sending...' : 'Resend magic link'}
                    </button>
                    {passwordFallback && (
                      <button
                        type="button"
                        onClick={() => {
                          setMagicSent(false);
                          setError('');
                        }}
                        className="text-base font-medium text-brand"
                      >
                        Use password instead
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMagicSent(false);
                        setEmail('');
                        setPasswordFallback(false);
                        setError('');
                      }}
                      className="block w-full text-base font-medium text-slate-500"
                    >
                      Change email
                    </button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <h2 className="text-[44px] font-bold tracking-normal text-slate-950 md:text-[48px]">Welcome back</h2>
                      <p className="mt-3 text-xl text-slate-500">Sign in or create an account to continue</p>
                    </div>

                    <div className="mt-16">
                      <label className="mb-5 block text-xl font-medium text-slate-950">Email address</label>
                      <div className="relative">
                        <input
                          className="h-[88px] w-full rounded-xl border border-slate-300 px-7 pr-16 text-2xl text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
                          placeholder="Email address"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            setError('');
                            setMagicSent(false);
                            setPasswordFallback(false);
                          }}
                        />
                        <UserIcon className="absolute right-7 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400" />
                      </div>

                      <label className="mb-5 mt-7 block text-xl font-medium text-slate-950">Password</label>
                      <input
                        className="h-[78px] w-full rounded-xl border border-slate-300 px-7 text-xl text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError('');
                        }}
                      />

                      <button
                        onClick={submitPassword}
                        disabled={loading}
                        className="relative mt-10 flex h-[88px] w-full items-center justify-center rounded-xl bg-brand text-xl font-semibold text-white shadow-[0_12px_24px_rgba(21,94,237,0.26)] transition hover:bg-[#0f50d4] disabled:opacity-60"
                      >
                        <span>{loading ? 'Please wait...' : 'Sign in'}</span>
                        {!loading && <ArrowRightIcon className="absolute right-8 h-7 w-7" />}
                      </button>

                      {error && <p className="mt-5 text-center text-base text-red-600">{error}</p>}

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-base">
                        <a href="/auth/forgot" className="font-medium text-brand">
                          Forgot password?
                        </a>
                        <a href="/auth/register" className="font-medium text-slate-600 hover:text-brand">
                          Create account
                        </a>
                      </div>
                    </div>

                    <div className="my-16 grid grid-cols-[1fr_auto_1fr] items-center gap-6 text-lg text-slate-500">
                      <span className="h-px bg-slate-200" />
                      <span>or</span>
                      <span className="h-px bg-slate-200" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={continueWithEmail}
                        disabled={loading}
                        className="flex h-[76px] w-full items-center justify-center gap-4 rounded-xl border border-slate-300 bg-white text-lg font-semibold text-slate-950 transition hover:border-slate-400 disabled:opacity-60"
                      >
                        <EnvelopeIcon className="h-7 w-7 text-brand" />
                        Email magic link
                      </button>

                      {googleClientId && (
                        <button
                          type="button"
                          onClick={continueWithGoogle}
                          className="flex h-[76px] w-full items-center justify-center gap-4 rounded-xl border border-slate-300 bg-white text-lg font-semibold text-slate-950 transition hover:border-slate-400"
                        >
                          <GoogleMark />
                          Continue with Google
                        </button>
                      )}
                    </div>

                    <div className="my-12 h-px bg-slate-200" />

                    <div className="grid gap-7 md:grid-cols-3">
                      <div className="flex gap-4">
                        <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                          <EnvelopeIcon className="h-8 w-8 text-brand" />
                        </span>
                        <div>
                          <p className="text-lg font-bold">Magic link</p>
                          <p className="mt-2 text-base leading-7 text-slate-600">Passwordless sign in</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                          <KeyIcon className="h-8 w-8 text-[#7ca1d2]" />
                        </span>
                        <div>
                          <p className="text-lg font-bold">Password reset</p>
                          <p className="mt-2 text-base leading-7 text-slate-600">Recover access by email</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                          <ShieldCheckIcon className="h-8 w-8 text-[#7ca1d2]" />
                        </span>
                        <div>
                          <p className="text-lg font-bold">Secure</p>
                          <p className="mt-2 text-base leading-7 text-slate-600">Your data is always protected</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-24 text-center text-base text-slate-500">
                      By continuing, you agree to our{' '}
                      <a href="#" className="text-brand">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-brand">
                        Privacy Policy
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

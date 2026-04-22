'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { getNextPathFromWindow } from '../../../lib/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'password' | 'otp'>('password');
  const [error, setError] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setNextPath(getNextPathFromWindow());
  }, []);

  const handleLogin = async () => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user);
      router.push(nextPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const requestOtp = async () => {
    try {
      await api.post('/auth/otp/request', { email });
      setStep('otp');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP request failed');
    }
  };

  const verifyOtp = async () => {
    try {
      const { data } = await api.post('/auth/otp/verify', { email, code: otp });
      login(data.user);
      router.push(nextPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verify failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white shadow-xl rounded-3xl grid md:grid-cols-2 overflow-hidden max-w-4xl w-full">
        <div className="bg-brand text-white p-8 space-y-4 hidden md:block">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm text-white/80">Access your dashboard, manage inquiries, and list properties.</p>
          <div className="space-y-2 text-sm text-white/80">
            <p>✓ Admin: manage users & listings</p>
            <p>✓ Agent: add properties</p>
            <p>✓ User: browse & save favorites</p>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex gap-4 text-sm">
            <button
              onClick={() => setStep('password')}
              className={`px-3 py-1 rounded-full border ${step === 'password' ? 'bg-brand text-white border-brand' : 'text-slate-600'}`}
            >
              Password Login
            </button>
            <button
              onClick={() => setStep('otp')}
              className={`px-3 py-1 rounded-full border ${step === 'otp' ? 'bg-brand text-white border-brand' : 'text-slate-600'}`}
            >
              OTP Login
            </button>
            <Link href={nextPath !== '/dashboard' ? `/auth/register?next=${encodeURIComponent(nextPath)}` : "/auth/register"} className="ml-auto text-brand">Create account</Link>
          </div>
          <p className="text-xs text-slate-500">
            Access is determined by the role assigned to your account on the server.
          </p>
          <div className="space-y-4">
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {step === 'password' && (
              <>
                <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin} className="w-full bg-brand text-white py-2 rounded-lg font-semibold">Login</button>
              </>
            )}
            {step === 'otp' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button type="button" onClick={requestOtp} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Send OTP</button>
                  <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  <button type="button" onClick={verifyOtp} className="px-4 py-2 bg-brand text-white rounded-lg text-sm">Verify</button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-sm text-slate-600">Forgot password? <a href="/auth/forgot" className="text-brand">Reset</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

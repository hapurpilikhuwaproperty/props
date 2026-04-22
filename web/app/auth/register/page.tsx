'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { getNextPathFromWindow } from '../../../lib/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setNextPath(getNextPathFromWindow());
  }, []);

  const handleRegister = async () => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data.user);
      router.push(nextPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white shadow-xl rounded-3xl grid md:grid-cols-2 overflow-hidden max-w-4xl w-full">
        <div className="bg-brand text-white p-8 space-y-4 hidden md:block">
          <h2 className="text-2xl font-semibold">Create an account</h2>
          <p className="text-sm text-white/80">Get instant access to listings, favorites, and guided visits.</p>
          <div className="space-y-2 text-sm text-white/80">
            <p>✓ Save and compare projects</p>
            <p>✓ Schedule site visits</p>
            <p>✓ Financing assistance</p>
          </div>
        </div>
        <div className="p-8 space-y-5">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <div className="space-y-4">
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={handleRegister} className="w-full bg-brand text-white py-2 rounded-lg font-semibold">Create account</button>
            <p className="text-sm text-slate-600">Already have an account? <a href={nextPath !== '/dashboard' ? `/auth/login?next=${encodeURIComponent(nextPath)}` : "/auth/login"} className="text-brand">Login</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

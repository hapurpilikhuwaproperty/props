"use client";
import { useState } from 'react';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMsg('');
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      await axios.post(`${backend}/auth/forgot`, { email });
      setMsg('If this email exists, reset instructions have been sent.');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 max-w-md">
      <h1 className="text-3xl font-semibold mb-6">Reset password</h1>
      <div className="space-y-4">
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {msg && <p className="text-sm text-brand">{msg}</p>}
        <button onClick={submit} disabled={loading} className="w-full bg-brand text-white py-2 rounded-lg font-semibold">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </div>
    </div>
  );
}


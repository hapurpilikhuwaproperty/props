'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function MagicLinkPage() {
  const [message, setMessage] = useState('Signing you in...');
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setMessage('This sign-in link is missing a token.');
      return;
    }

    api
      .post('/auth/magic/verify', { token })
      .then(({ data }) => {
        if (data?.mfaRequired) {
          setMessage('Admin MFA is required. Please sign in from the login page to complete verification.');
          router.push('/auth/login');
          return;
        }
        login(data.user);
        router.push('/dashboard');
      })
      .catch((error) => {
        setMessage(error.response?.data?.message || 'This sign-in link is invalid or expired.');
      });
  }, [login, router]);

  return <div className="container py-12 text-sm text-slate-600">{message}</div>;
}

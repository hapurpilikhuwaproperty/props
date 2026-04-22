'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { canManageProperties, useAuth } from '../lib/auth-context';
import { BRAND } from '../lib/constants';

const links = [
  { href: '/', label: 'Home' },
  { href: '/properties', label: 'Properties' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAuthed, logout, role } = useAuth();
  const canAddProperty = canManageProperties(role);
  const isAdmin = role === 'admin';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200 shadow">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-semibold text-brand">{BRAND.NAME}</Link>
        <nav className="hidden md:flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx('text-sm font-medium hover:text-brand-accent transition-colors', {
                'text-brand': pathname === link.href,
                'text-slate-600': pathname !== link.href,
              })}
            >
              {link.label}
            </Link>
          ))}
          {isAuthed && (
            <Link
              href="/dashboard/shortlists"
              className={clsx('text-sm font-medium hover:text-brand-accent transition-colors', {
                'text-brand': pathname === '/dashboard/shortlists',
                'text-slate-600': pathname !== '/dashboard/shortlists',
              })}
            >
              Shortlists
            </Link>
          )}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <>
              {isAdmin && <Link href="/dashboard" className="text-sm">Admin</Link>}
              {canAddProperty && <Link href="/dashboard/properties/new" className="text-sm">Add property</Link>}
              <button onClick={logout} className="text-sm text-slate-600 hover:text-brand">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm">Login</Link>
              <Link href="/auth/register" className="bg-brand text-white px-4 py-2 rounded-full text-sm font-medium">List a property</Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-slate-200">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block px-4 py-3 border-b" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {isAuthed && (
            <Link href="/dashboard/shortlists" className="block px-4 py-3 border-b" onClick={() => setOpen(false)}>
              Shortlists
            </Link>
          )}
          <div className="px-4 py-3 flex gap-3 items-center">
            {isAuthed ? (
              <>
                <Link href="/dashboard" className="text-sm" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={() => { logout(); setOpen(false); }} className="text-sm text-slate-600">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm" onClick={() => setOpen(false)}>Login</Link>
                <Link href="/auth/register" className="bg-brand text-white px-4 py-2 rounded-full text-sm font-medium" onClick={() => setOpen(false)}>List a property</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bars3Icon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { canManageProperties, useAuth } from '../lib/auth-context';

const primaryLinks = [
  { href: '/properties?type=APARTMENT', label: 'Buy' },
  { href: '/properties?status=AVAILABLE', label: 'Rent' },
  { href: '/properties?type=PLOT', label: 'Plots' },
  { href: '/properties?type=COMMERCIAL', label: 'Commercial' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAuthed, logout, role } = useAuth();
  const canAddProperty = canManageProperties(role);
  const isAdmin = role === 'admin';

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="container flex h-[70px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#003a80] text-white shadow-sm">
            <BuildingOffice2Icon className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-extrabold leading-tight tracking-normal text-slate-950 md:text-xl">
              Hapur-Pilkhuwa-Properties
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Hapur · Pilkhuwa
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={clsx('text-sm font-semibold transition-colors hover:text-[#003a80]', {
                'text-[#003a80]': pathname === link.href,
                'text-slate-700': pathname !== link.href,
              })}
            >
              {link.label}
            </Link>
          ))}
          {isAuthed && (
            <Link href="/dashboard" className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#003a80]">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/properties" aria-label="Search properties" className="grid h-10 w-10 place-items-center rounded-full text-slate-800 hover:bg-slate-100">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </Link>
          {isAuthed ? (
            <>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">{role}</span>
              {isAdmin && <Link href="/dashboard/users" className="text-sm font-semibold text-slate-700">Users</Link>}
              {canAddProperty && (
                <Link href="/dashboard/properties/new" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7826] px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-[#ff8a3d]">
                  <PlusIcon className="h-5 w-5" />
                  Post Property
                </Link>
              )}
              <button onClick={logout} className="text-sm font-semibold text-slate-600 hover:text-[#003a80]">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-semibold text-slate-700">Login</Link>
              <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7826] px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-[#ff8a3d]">
                <PlusIcon className="h-5 w-5" />
                Post Property
              </Link>
            </>
          )}
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-full border md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          {[{ href: '/', label: 'Home' }, ...primaryLinks, { href: '/properties', label: 'Search' }].map((link) => (
            <Link key={link.label} href={link.href} className="block px-4 py-3 text-sm font-semibold text-slate-700" onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          {isAuthed && (
            <>
              <Link href="/dashboard" className="block px-4 py-3 text-sm font-semibold text-slate-700" onClick={closeMenu}>Dashboard</Link>
              {isAdmin && <Link href="/dashboard/users" className="block px-4 py-3 text-sm font-semibold text-slate-700" onClick={closeMenu}>Users</Link>}
            </>
          )}
          <div className="flex items-center gap-3 px-4 py-4">
            {isAuthed ? (
              <>
                {canAddProperty && (
                  <Link href="/dashboard/properties/new" className="rounded-2xl bg-[#ff7826] px-4 py-2 text-sm font-bold text-slate-950" onClick={closeMenu}>
                    Post Property
                  </Link>
                )}
                <button onClick={() => { void logout(); closeMenu(); }} className="text-sm font-semibold text-slate-600">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-slate-700" onClick={closeMenu}>Login</Link>
                <Link href="/auth/register" className="rounded-2xl bg-[#ff7826] px-4 py-2 text-sm font-bold text-slate-950" onClick={closeMenu}>Post Property</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

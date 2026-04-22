/* eslint-disable @next/next/no-img-element */
"use client";
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LeadModal from './LeadModal';

export default function Hero() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [type, setType] = useState('All');
  const [budget, setBudget] = useState('Any Budget');

  const handleSearch = () => {
    trackEvent('search_submit', { location, type, budget });
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (type !== 'All') params.set('type', type.toUpperCase());
    if (budget !== 'Any Budget') {
      if (budget === 'Under ₹1 Cr') params.set('maxPrice', '10000000');
      if (budget === '₹1-3 Cr') {
        params.set('minPrice', '10000000');
        params.set('maxPrice', '30000000');
      }
      if (budget === '₹3 Cr+') params.set('minPrice', '30000000');
    }
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#155EED,#0B3C9D)' }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=70)', backgroundSize: 'cover', mixBlendMode: 'soft-light' }} />
      <div className="container max-w-6xl relative py-16 md:py-20 space-y-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-white/80 animate-fade-up">Start Your Property Hunt</p>
        <h1 className="text-3xl md:text-4xl font-semibold animate-fade-up" style={{ animationDelay: '70ms' }}>
          Discover curated homes across NCR
        </h1>
        <p className="text-white/80 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '140ms' }}>
          Filters-first search, verified paperwork, guided site visits, and financing support— all in one place.
        </p>

        <div className="max-w-4xl mx-auto bg-white rounded-full shadow-card flex flex-col md:flex-row md:items-center gap-2 p-3 animate-scale-in" style={{ animationDelay: '210ms' }}>
          <div className="flex items-center gap-2 px-3 w-full">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
            <input
              className="w-full outline-none text-slate-800"
              placeholder="Search by city, micromarket, or project"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="flex gap-2 md:w-auto w-full px-2">
            <select
              className="w-full md:w-40 border md:border-0 rounded-full px-3 py-2 text-sm text-slate-700"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>All</option>
              <option>Apartment</option>
              <option>Villa</option>
              <option>Commercial</option>
            </select>
            <select
              className="w-full md:w-40 border md:border-0 rounded-full px-3 py-2 text-sm text-slate-700"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              <option>Any Budget</option>
              <option>Under ₹1 Cr</option>
              <option>₹1-3 Cr</option>
              <option>₹3 Cr+</option>
            </select>
          </div>
          <button onClick={handleSearch} className="bg-brand text-white px-5 py-2 rounded-full font-semibold">Search</button>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm animate-fade-up" style={{ animationDelay: '280ms' }}>
          <Link href="/properties" className="px-5 py-2 bg-white/10 border border-white/20 rounded-full hover:bg-white/15 transition-colors">Explore Listings</Link>
          <Link href="/auth/register" className="px-5 py-2 bg-white text-brand font-semibold rounded-full hover:-translate-y-0.5 transition">List your property</Link>
          <LeadModal triggerClassName="bg-white/10 border border-white/20" triggerLabel="Talk to an expert" />
        </div>
      </div>
    </section>
  );
}
import { trackEvent } from '../lib/analytics';

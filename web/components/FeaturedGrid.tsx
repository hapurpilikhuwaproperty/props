"use client";
import { useEffect, useRef, useState } from 'react';
import PropertyCard from './PropertyCard';
import { Property } from '../types';
import { api } from '../lib/api';

const tabs = [
  { label: 'All', query: {} },
  { label: 'Ready to Move', query: { status: 'AVAILABLE' } },
  { label: 'New Launch', query: { status: 'PENDING' } },
  { label: 'Residential', query: { type: 'APARTMENT' } },
  { label: 'Commercial', query: { type: 'COMMERCIAL' } },
];

export default function FeaturedGrid({ properties }: { properties: Property[] }) {
  const [active, setActive] = useState(tabs[0].label);
  const [items, setItems] = useState<Property[]>(properties);
  const [loading, setLoading] = useState(false);
  const requestController = useRef<AbortController | null>(null);

  const fetchData = async (query: Record<string, string>) => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    try {
      const { data } = await api.get('/properties', { params: { pageSize: 6, ...query }, signal: controller.signal });
      if (controller.signal.aborted) return;
      setItems(data.items);
    } catch (error: any) {
      if (error?.code === 'ERR_CANCELED') return;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setItems(properties);
  }, [properties]);

  useEffect(() => () => requestController.current?.abort(), []);

  return (
    <section className="container py-16 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Today’s popular projects</p>
          <h2 className="text-2xl font-semibold">Handpicked for you</h2>
        </div>
        <div className="flex gap-2 text-sm flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                setActive(t.label);
                fetchData(t.query as any);
              }}
              className={`px-3 py-1 rounded-full border ${active === t.label ? 'bg-brand text-white border-brand' : 'text-slate-600 hover:border-brand hover:text-brand'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
            ))
          : items.map((property) => <PropertyCard key={property.id} property={property} />)}
      </div>
    </section>
  );
}

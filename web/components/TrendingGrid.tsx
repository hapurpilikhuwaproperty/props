"use client";
import { useEffect, useState } from 'react';
import PropertyCard from './PropertyCard';
import { Property } from '../types';
import { api } from '../lib/api';

export default function TrendingGrid({ properties }: { properties: Property[] }) {
  const [items, setItems] = useState<Property[]>(properties.slice(0, 4));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrending = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/properties', {
          params: { sort: 'price_desc', pageSize: 4 },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(data.items);
      } catch (error: any) {
        if (error?.code === 'ERR_CANCELED') return;
        setItems(properties.slice(0, 4));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTrending();
    return () => controller.abort();
  }, [properties]);

  return (
    <section className="container pb-14 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Trending Projects</p>
          <h3 className="text-xl font-semibold">Popular picks this week</h3>
        </div>
        <a href="/properties" className="text-sm text-brand">View all</a>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-56 bg-slate-100 animate-pulse rounded-2xl" />)
          : items.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </section>
  );
}

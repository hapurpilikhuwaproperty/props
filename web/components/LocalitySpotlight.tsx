"use client";
import Link from "next/link";
import { LocalitySummary } from "../types";

export default function LocalitySpotlight({ items }: { items: LocalitySummary[] }) {
  if (items.length === 0) return null;

  return (
    <section className="container py-14 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Locality intelligence</p>
          <h2 className="text-2xl font-semibold">Micro-markets with momentum</h2>
        </div>
        <Link href={`/localities/${items[0].slug}`} className="text-sm text-brand">Open locality deep dive</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <Link key={item.slug} href={`/localities/${item.slug}`} className="rounded-3xl border bg-white p-5 space-y-3 hover-lift">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{item.name}</p>
              <span className="text-xs px-3 py-1 rounded-full bg-brand-soft text-brand">Live</span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{item.headline}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Livability</p>
                <p className="font-semibold">{item.livabilityScore}/100</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Rental demand</p>
                <p className="font-semibold">{item.rentalDemandScore}/100</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Listings</p>
                <p className="font-semibold">{item.listingCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Avg. quality</p>
                <p className="font-semibold">{item.averageQuality}/100</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {item.collaborationSignals} shortlist saves • {item.visitMomentum} visit signals
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

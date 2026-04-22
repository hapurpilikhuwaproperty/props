"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Property } from '../types';
import { useCompare } from '../lib/compare-context';

export default function PropertyCard({ property }: { property: Property }) {
  const cover = property.images.find((img) => img.isCover) || property.images[0];
  const { toggle, isAdded } = useCompare();
  const price = Number(property.price);
  const area = (property as any).areaSqFt ? Number((property as any).areaSqFt) : null;
  const emi = price && area ? Math.round((price * 0.075 / 12 * Math.pow(1 + 0.075 / 12, 240)) / (Math.pow(1 + 0.075 / 12, 240) - 1)) : null;
  const ppsf = area ? Math.round(price / area) : null;
  return (
    <Link href={`/properties/${property.id}`} className="group block bg-white shadow-card rounded-2xl overflow-hidden hover-lift">
      {cover && (
        <div className="aspect-[4/3] relative">
          <Image
            src={cover.url}
            alt={property.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            placeholder="blur"
            blurDataURL={cover.url + '?w=10&q=10'}
          />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full uppercase">{(property.freshnessDays ?? 0) <= 7 ? 'Fresh' : 'Live'}</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{property.type.toLowerCase()}</span>
          {property.verified && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase">Verified</span>}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-brand-accent font-semibold">₹{price.toLocaleString('en-IN')}</p>
          <span className="text-xs bg-brand-soft text-brand px-3 py-1 rounded-full capitalize">{property.status.toLowerCase()}</span>
        </div>
        <p className="font-semibold text-slate-900 line-clamp-1">{property.title}</p>
        <p className="text-sm text-slate-500 line-clamp-2">{property.location}</p>
        {property.recommendationReason && <p className="text-xs text-brand line-clamp-2">{property.recommendationReason}</p>}
        <div className="flex gap-3 text-xs text-slate-600">
          <span>{property.bedrooms} bd</span>
          <span>{property.bathrooms} ba</span>
          <span>{property.type.toLowerCase()}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          {ppsf ? <span>₹{ppsf.toLocaleString()}/sqft</span> : <span />}
          {emi ? <span>Est. EMI ₹{emi.toLocaleString()}/mo</span> : null}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Score {property.qualityScore ?? 0}/100</span>
          <span>{property.responseTimeHours ? `${property.responseTimeHours}h response` : `${property.inquiryCount ?? 0} leads`}</span>
        </div>
        {property.localitySlug && (
          <div className="text-xs text-slate-500">
            <span>Locality intelligence: </span>
            <span className="text-brand">{property.localityName || property.location}</span>
          </div>
        )}
        {typeof property.shortlistCount === "number" && property.shortlistCount > 0 && (
          <div className="text-xs text-slate-500">{property.shortlistCount} shared shortlist saves</div>
        )}
        <div className="flex items-center justify-between text-xs mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle(property);
            }}
            className={`px-3 py-1 rounded-full border transition ${isAdded(property.id) ? 'bg-brand text-white border-brand' : 'text-slate-600 hover:border-brand hover:text-brand'}`}
          >
            {isAdded(property.id) ? 'Added to compare' : 'Compare'}
          </button>
          <span className="text-brand font-semibold">Know more</span>
        </div>
      </div>
    </Link>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  HeartIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { CONTACT } from "../lib/constants";
import { useCompare } from "../lib/compare-context";
import { resolveMediaUrl } from "../lib/media";
import { formatCompactPrice, formatPricePerSqft } from "../lib/property-format";
import { Property } from "../types";

const statusLabel = (status: string) => {
  if (status === "SOLD") return "Sold";
  if (status === "PENDING") return "Reserved";
  return "For Sale";
};

export default function PropertyCard({ property }: { property: Property }) {
  const cover = property.images.find((image) => image.isCover) || property.images[0];
  const coverUrl = resolveMediaUrl(cover?.url);
  const { toggle, isAdded } = useCompare();
  const area = property.areaSqFt ? Number(property.areaSqFt) : null;
  const pricePerSqft = formatPricePerSqft(property.price, area);
  const isFresh = (property.freshnessDays ?? 0) <= 7;
  const phoneHref = `tel:${CONTACT.PHONE.replace(/\s/g, "")}`;
  const scarcity = property.status === "AVAILABLE" ? `Only ${(property.id % 3) + 1} left` : statusLabel(property.status);

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.13)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(15,23,42,0.16)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {coverUrl ? (
          <Image src={coverUrl} alt={property.title} fill className="object-cover transition duration-500 hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-slate-100 text-sm font-semibold text-slate-500">No image</div>
        )}

        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-extrabold uppercase text-white">
              <ShieldCheckIcon className="h-4 w-4" />
              Verified
            </span>
          )}
          {isFresh && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6f1d] px-3 py-1.5 text-xs font-extrabold uppercase text-slate-950">
              <SparklesIcon className="h-4 w-4" />
              New
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label="Add to compare"
          onClick={() => toggle(property)}
          className={`absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/95 shadow-sm transition ${isAdded(property.id) ? "text-[#003a80]" : "text-slate-950 hover:text-[#003a80]"}`}
        >
          <HeartIcon className={`h-7 w-7 ${isAdded(property.id) ? "fill-[#003a80]" : ""}`} />
        </button>

        <span className="absolute bottom-5 left-5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-extrabold text-white">
          {scarcity}
        </span>

        {property.videoUrl && (
          <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-xs font-extrabold text-white backdrop-blur">
            <PlayIcon className="h-4 w-4 fill-white" />
            Video
          </span>
        )}

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          <span className="h-2 w-9 rounded-full bg-white" />
          <span className="h-2 w-2 rounded-full bg-white/70" />
          <span className="h-2 w-2 rounded-full bg-white/70" />
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-3xl font-extrabold tracking-normal text-slate-950">{formatCompactPrice(property.price)}</p>
            {pricePerSqft && <p className="mt-1 text-sm font-medium text-slate-500">{pricePerSqft}</p>}
          </div>
          <span className="rounded-full bg-[#eaf2ff] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#003a80]">
            {statusLabel(property.status)}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-1 text-xl font-extrabold tracking-normal text-slate-950">{property.title}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <MapPinIcon className="h-5 w-5" />
            {property.location}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-slate-600">
            {property.bedrooms > 0 && (
              <span className="inline-flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-[#003a80]" />
                {property.bedrooms} BHK
              </span>
            )}
            {property.bathrooms > 0 && <span>{property.bathrooms} Bath</span>}
            {area && (
              <span className="inline-flex items-center gap-2">
                <ArrowTopRightOnSquareIcon className="h-5 w-5 text-[#003a80]" />
                {area.toLocaleString("en-IN")} sq.ft
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_56px] gap-3">
          <Link href={`/properties/${property.id}`} className="rounded-2xl border border-[#a9bdd8] px-5 py-3 text-center text-sm font-extrabold text-[#003a80] transition hover:bg-[#eaf2ff]">
            View Details
          </Link>
          <a href={phoneHref} aria-label="Call now" className="grid h-12 place-items-center rounded-2xl bg-[#ff7826] text-slate-950 transition hover:bg-[#ff8a3d]">
            <PhoneIcon className="h-6 w-6" />
          </a>
        </div>
      </div>
    </article>
  );
}

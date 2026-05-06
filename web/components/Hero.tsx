"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { trackEvent } from "../lib/analytics";
import { CONTACT } from "../lib/constants";
import { resolveMediaUrl } from "../lib/media";
import { formatCompactPrice, formatPricePerSqft } from "../lib/property-format";
import { Property } from "../types";

const fallbackHero = {
  id: 0,
  title: "Luxury 4 BHK Villa with Lawn",
  location: "Meerut Road, Hapur",
  price: 8_500_000,
  bedrooms: 4,
  bathrooms: 4,
  areaSqFt: 2000,
  type: "VILLA",
  status: "AVAILABLE",
  verified: true,
  images: [
    {
      url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1800&q=85",
      isCover: true,
    },
  ],
} as Property;

type PropertySlide = {
  kind: "property";
  property: Property;
};

type PromoSlide = {
  kind: "promo";
  id: string;
  title: string;
  eyebrow: string;
  location: string;
  priceText: string;
  description: string;
  backgroundUrl: string;
  primaryHref: string;
  primaryLabel: string;
};

type HeroSlide = PropertySlide | PromoSlide;

const postPropertySlide: PromoSlide = {
  kind: "promo",
  id: "post-property",
  title: "Post Your Property and Reach Verified Local Buyers",
  eyebrow: "Seller Desk",
  location: "Hapur · Pilkhuwa · Nearby NCR",
  priceText: "List Free",
  description: "Add photos, video, price, location and seller details. Our team can help verify and promote serious listings.",
  backgroundUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=85",
  primaryHref: "/dashboard/properties/new",
  primaryLabel: "Post Property",
};

const advisorySlide: PromoSlide = {
  kind: "promo",
  id: "buyer-desk",
  title: "Find Verified Homes, Plots and Commercial Spaces Faster",
  eyebrow: "Buyer Desk",
  location: "Local guidance for Hapur and Pilkhuwa",
  priceText: "Verified Deals",
  description: "Compare listings, request visits, call sellers and shortlist properties with confidence.",
  backgroundUrl: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1800&q=85",
  primaryHref: "/properties",
  primaryLabel: "Explore Listings",
};

const propertyStatus = (status?: string) => {
  if (status === "SOLD") return "Sold";
  if (status === "PENDING") return "Reserved";
  return "For Sale";
};

export default function Hero({ properties = [] }: { properties?: Property[] }) {
  const router = useRouter();
  const slides = useMemo<HeroSlide[]>(() => {
    const propertySlides = (properties.length ? properties.slice(0, 4) : [fallbackHero]).map((property) => ({
      kind: "property" as const,
      property,
    }));

    return properties.length
      ? [...propertySlides, postPropertySlide]
      : [advisorySlide, postPropertySlide, ...propertySlides];
  }, [properties]);
  const [active, setActive] = useState(0);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("All");
  const [budget, setBudget] = useState("Any Budget");
  const current = slides[active] || slides[0];
  const currentProperty = current.kind === "property" ? current.property : null;
  const cover = currentProperty?.images?.find((image) => image.isCover) || currentProperty?.images?.[0];
  const coverUrl = current.kind === "property"
    ? resolveMediaUrl(cover?.url || fallbackHero.images[0].url)
    : current.backgroundUrl;
  const pricePerSqft = currentProperty ? formatPricePerSqft(currentProperty.price, currentProperty.areaSqFt) : null;
  const phoneHref = `tel:${CONTACT.PHONE.replace(/\s/g, "")}`;
  const whatsappHref = `https://wa.me/${CONTACT.WHATSAPP.replace(/[^0-9]/g, "")}`;

  const moveSlide = (direction: "previous" | "next") => {
    setActive((index) => {
      if (direction === "next") return (index + 1) % slides.length;
      return (index - 1 + slides.length) % slides.length;
    });
  };

  const handleSearch = () => {
    trackEvent("search_submit", { location, type, budget });
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (type !== "All") params.set("type", type.toUpperCase());
    if (budget !== "Any Budget") {
      if (budget === "Under ₹1 Cr") params.set("maxPrice", "10000000");
      if (budget === "₹1-3 Cr") {
        params.set("minPrice", "10000000");
        params.set("maxPrice", "30000000");
      }
      if (budget === "₹3 Cr+") params.set("minPrice", "30000000");
    }
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[calc(100vh-70px)] overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url(${coverUrl})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.86)_0%,rgba(2,6,23,0.62)_40%,rgba(2,6,23,0.38)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 to-transparent" />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous featured property"
            onClick={() => moveSlide("previous")}
            className="absolute left-3 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 md:left-6"
          >
            <ChevronLeftIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            aria-label="Next featured property"
            onClick={() => moveSlide("next")}
            className="absolute right-3 top-1/2 z-10 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 md:right-6"
          >
            <ChevronRightIcon className="h-7 w-7" />
          </button>
        </>
      )}

      <div className="container relative z-10 flex min-h-[calc(100vh-70px)] flex-col justify-end pb-8 pt-10">
        <div className="max-w-5xl pb-10 md:pl-6">
          <div className="flex flex-wrap items-center gap-3">
            {currentProperty?.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white">
                <ShieldCheckIcon className="h-4 w-4" />
                Verified
              </span>
            )}
            <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide backdrop-blur">
              {current.kind === "property" ? propertyStatus(current.property.status) : current.eyebrow}
            </span>
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-normal text-white md:text-6xl">
            {current.kind === "property" ? current.property.title : current.title}
          </h1>

          <p className="mt-4 flex items-center gap-2 text-base font-medium text-white/85">
            <MapPinIcon className="h-5 w-5 text-[#ff7826]" />
            {current.kind === "property" ? current.property.location : current.location}
          </p>

          <div className="mt-7 flex flex-wrap items-end gap-4">
            <p className="text-5xl font-extrabold tracking-normal text-[#ff7826] md:text-6xl">
              {current.kind === "property" ? formatCompactPrice(current.property.price) : current.priceText}
            </p>
            {pricePerSqft && <p className="mb-2 text-sm font-semibold text-white/75">{pricePerSqft}</p>}
          </div>

          {current.kind === "property" ? (
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold text-white/85">
              {current.property.bedrooms > 0 && <span className="inline-flex items-center gap-2"><HomeIcon className="h-5 w-5 text-[#ff7826]" />{current.property.bedrooms} BHK</span>}
              {current.property.bathrooms > 0 && <span>{current.property.bathrooms} Bath</span>}
              {current.property.areaSqFt && <span className="inline-flex items-center gap-2"><ArrowTopRightOnSquareIcon className="h-5 w-5 text-[#ff7826]" />{Number(current.property.areaSqFt).toLocaleString("en-IN")} sq.ft</span>}
              <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs uppercase">{current.property.type}</span>
            </div>
          ) : (
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-white/80">{current.description}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={current.kind === "property" ? `/properties/${current.property.id}` : current.primaryHref} className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-[#003a80] shadow-lg transition hover:bg-slate-100">
              {current.kind === "property" ? <PlayIcon className="h-5 w-5 fill-[#003a80]" /> : <PlusIcon className="h-5 w-5" />}
              {current.kind === "property" ? "View Details" : current.primaryLabel}
            </Link>
            <a href={phoneHref} className="inline-flex items-center gap-2 rounded-2xl bg-[#ff7826] px-6 py-4 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-[#ff8a3d]">
              <PhoneIcon className="h-5 w-5" />
              Call Now
            </a>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-700">
              WhatsApp
            </a>
          </div>
        </div>

        <div className="mx-auto mb-4 flex items-center gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.kind === "property" ? slide.property.id || index : slide.id}
              aria-label={`Open slide ${index + 1}`}
              onClick={() => setActive(index)}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-14 bg-[#ff7826]" : "w-8 bg-white/55"}`}
            />
          ))}
        </div>

        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-white/20 bg-black/35 p-3 shadow-2xl backdrop-blur-md md:p-4">
          <div
            className="rounded-2xl bg-cover bg-center p-3 md:p-4"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.94), rgba(255,255,255,0.88)), url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80)",
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border bg-white px-4 py-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
                <input
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  placeholder="Search Hapur, Pilkhuwa, project or road"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </div>
              <select className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-800" value={type} onChange={(event) => setType(event.target.value)}>
                <option>All</option>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Plot</option>
                <option>Commercial</option>
              </select>
              <select className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-800" value={budget} onChange={(event) => setBudget(event.target.value)}>
                <option>Any Budget</option>
                <option>Under ₹1 Cr</option>
                <option>₹1-3 Cr</option>
                <option>₹3 Cr+</option>
              </select>
              <button onClick={handleSearch} className="rounded-2xl bg-[#003a80] px-7 py-3 text-sm font-extrabold text-white transition hover:bg-[#064a9e]">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

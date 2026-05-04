"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import PropertyCard from "./PropertyCard";
import { Property } from "../types";

export default function LatestPropertySlider({ properties }: { properties: Property[] }) {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  if (properties.length === 0) return null;

  const scrollByCard = (direction: "previous" | "next") => {
    const slider = sliderRef.current;
    if (!slider) return;
    const cardWidth = slider.firstElementChild?.clientWidth || 320;
    slider.scrollBy({
      left: direction === "next" ? cardWidth + 24 : -(cardWidth + 24),
      behavior: "smooth",
    });
  };

  return (
    <section className="container py-14 space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Latest properties</p>
          <h2 className="text-2xl font-semibold">Recently added listings</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous latest properties"
            onClick={() => scrollByCard("previous")}
            className="grid h-10 w-10 place-items-center rounded-full border bg-white text-slate-700 shadow-sm"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next latest properties"
            onClick={() => scrollByCard("next")}
            className="grid h-10 w-10 place-items-center rounded-full border bg-white text-slate-700 shadow-sm"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <Link href="/properties" className="hidden text-sm text-brand sm:inline">
            View all
          </Link>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="flex snap-x gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((property) => (
          <div key={property.id} className="w-[82vw] shrink-0 snap-start sm:w-[360px] lg:w-[31%]">
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </section>
  );
}

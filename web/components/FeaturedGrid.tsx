import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import PropertyCard from "./PropertyCard";
import { Property } from "../types";

export default function FeaturedGrid({ properties }: { properties: Property[] }) {
  if (!properties.length) return null;

  return (
    <section className="container py-16 md:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#ff6f1d]">Handpicked</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-normal text-slate-950 md:text-5xl">Featured Properties</h2>
        </div>
        <Link href="/properties" className="hidden items-center gap-2 text-lg font-extrabold text-[#003a80] transition hover:text-[#ff6f1d] sm:inline-flex">
          View all
          <ArrowRightIcon className="h-6 w-6" />
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {properties.slice(0, 6).map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}

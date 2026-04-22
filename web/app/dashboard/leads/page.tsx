"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canManageProperties, useAuth } from "../../../lib/auth-context";
import { Property } from "../../../types";
import { api } from "../../../lib/api";

export default function LeadsPage() {
  const { role, isReady } = useAuth();
  const [items, setItems] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!canManageProperties(role)) {
      setLoading(false);
      setError("Only agents or admins can view listing management.");
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    api
      .get("/users/listings", { signal: controller.signal })
      .then((response) => {
        if (isActive) setItems(response.data);
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Failed to load listings");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isReady, role]);

  return (
    <div className="container py-10 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Listings</h1>
          <p className="text-sm text-slate-600">Manage your active inventory and jump into detail pages quickly.</p>
        </div>
        {canManageProperties(role) && (
          <Link href="/dashboard/properties/new" className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">
            + Add property
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading listings...</p>}
      {!loading && error && <p className="text-sm text-slate-600">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="bg-white border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.location}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-brand bg-brand-soft px-3 py-1 rounded-full">
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {item.verified ? "Verified" : item.verificationLevel?.replace("_", " ")}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Score {item.qualityScore}/100
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {item.inquiryCount} leads
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="font-semibold text-brand-accent">₹{Number(item.price).toLocaleString("en-IN")}</p>
                <p className="text-slate-500">{item.bedrooms} bd • {item.bathrooms} ba • {item.freshnessDays ?? 0}d fresh</p>
              </div>
              <Link href={`/properties/${item.id}`} className="inline-flex text-sm text-brand font-medium">
                Open property detail
              </Link>
            </article>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No listings yet.</p>}
        </div>
      )}
    </div>
  );
}

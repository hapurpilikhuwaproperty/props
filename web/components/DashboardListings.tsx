"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { canManageProperties, useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { Property } from "../types";

type DashboardListingsProps = {
  title?: string;
  subtitle?: string;
};

export default function DashboardListings({
  title = "Listings",
  subtitle = "Manage your active inventory and jump into detail pages quickly.",
}: DashboardListingsProps) {
  const { role, isReady } = useAuth();
  const [items, setItems] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const canManage = canManageProperties(role);

  useEffect(() => {
    if (!isReady) return;
    if (!canManage) {
      setLoading(false);
      setItems([]);
      setError("Only agents or admins can view listing management.");
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setLoading(true);
    setError("");

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
  }, [canManage, isReady]);

  const deleteListing = async (property: Property) => {
    const confirmed = window.confirm(`Delete "${property.title}"? This also removes related inquiries, visits, favorites, and shortlist entries.`);
    if (!confirmed) return;

    setDeletingId(property.id);
    setError("");

    try {
      await api.delete(`/properties/${property.id}`);
      setItems((current) => current.filter((item) => item.id !== property.id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete property");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container py-10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        {canManage && (
          <Link href="/dashboard/properties/new" className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">
            + Add property
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading listings...</p>}
      {!loading && error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

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
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/properties/${item.id}`} className="rounded-lg border px-3 py-2 font-medium text-slate-700">
                  View
                </Link>
                <Link href={`/dashboard/properties/${item.id}/edit`} className="rounded-lg border px-3 py-2 font-medium text-brand">
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteListing(item)}
                  className="rounded-lg border border-red-200 px-3 py-2 font-medium text-red-600 disabled:opacity-60"
                >
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No listings yet.</p>}
        </div>
      )}
    </div>
  );
}

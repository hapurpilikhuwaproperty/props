"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PropertyForm from "../../../../../components/PropertyForm";
import { canManageProperties, useAuth } from "../../../../../lib/auth-context";
import { api } from "../../../../../lib/api";
import { Property } from "../../../../../types";

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const { role, isReady } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;
    if (!canManageProperties(role)) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    api
      .get(`/properties/${params.id}`, { signal: controller.signal })
      .then((response) => {
        if (isActive) setProperty(response.data);
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Failed to load property");
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isReady, params.id, role]);

  if (!isReady || loading) {
    return <div className="container py-12"><p className="text-sm text-slate-600">Loading property...</p></div>;
  }

  if (!canManageProperties(role)) {
    return <div className="container py-12"><p className="text-sm text-slate-600">Only agents or admins can edit properties.</p></div>;
  }

  if (error || !property) {
    return <div className="container py-12"><p className="text-sm text-slate-600">{error || "Property not found."}</p></div>;
  }

  return (
    <div className="container max-w-3xl py-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Listings</p>
          <h1 className="text-3xl font-semibold mt-2">Edit property</h1>
          <p className="mt-1 text-sm text-slate-500">{property.title}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/properties/${property.id}`} className="text-brand">View listing</Link>
          <Link href="/dashboard/properties" className="text-brand">Back to listings</Link>
        </div>
      </div>
      <PropertyForm mode="edit" initialProperty={property} />
    </div>
  );
}

"use client";

import Link from "next/link";
import PropertyForm from "../../../../components/PropertyForm";
import { canManageProperties, useAuth } from "../../../../lib/auth-context";

export default function NewPropertyPage() {
  const { role, isReady } = useAuth();

  if (!isReady) {
    return <div className="container py-12"><p className="text-sm text-slate-600">Checking access...</p></div>;
  }

  if (!canManageProperties(role)) {
    return <div className="container py-12"><p className="text-sm text-slate-600">Only agents or admins can add properties.</p></div>;
  }

  return (
    <div className="container max-w-3xl py-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Listings</p>
          <h1 className="text-3xl font-semibold mt-2">Add New Property</h1>
        </div>
        <Link href="/dashboard/properties" className="text-sm text-brand">Back to listings</Link>
      </div>
      <PropertyForm mode="create" />
    </div>
  );
}

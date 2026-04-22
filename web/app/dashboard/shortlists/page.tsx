"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { Shortlist } from "../../../types";

export default function DashboardShortlistsPage() {
  const { isAuthed, isReady } = useAuth();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthed) {
      setError("Please log in to view shared shortlists.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setLoading(true);
    setError("");
    api
      .get("/shortlists", { signal: controller.signal })
      .then((response) => {
        if (isActive) setShortlists(response.data);
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Unable to load shortlists");
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
  }, [isAuthed, isReady]);

  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Collaboration</p>
          <h1 className="text-2xl font-semibold mt-2">Shared shortlists</h1>
          <p className="text-sm text-slate-600 mt-1">Save serious options from compare, share them, and align decisions with comments and votes.</p>
        </div>
        <Link href="/properties" className="px-4 py-2 rounded-full border text-sm font-medium">
          Add more properties
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading shortlists...</p>}
      {!loading && error && <p className="text-sm text-slate-600">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-2">
          {shortlists.map((shortlist) => (
            <Link key={shortlist.id} href={`/shortlists/${shortlist.shareToken}`} className="rounded-3xl border bg-white p-6 space-y-4 hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{shortlist.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {shortlist.itemCount} properties • {shortlist.collaborators.length + 1} decision-makers
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-brand-soft text-brand">
                  {shortlist.isOwner ? "Owner" : shortlist.canEdit ? "Editor" : "Viewer"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {shortlist.items.slice(0, 3).map((item) => (
                  <p key={item.id}>
                    {item.property.title} • team score {item.voteAverage ?? "NA"}
                  </p>
                ))}
                {shortlist.items.length === 0 && <p>No properties yet.</p>}
              </div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Updated {new Date(shortlist.updatedAt).toLocaleString()}
              </p>
            </Link>
          ))}
          {shortlists.length === 0 && (
            <div className="rounded-3xl border bg-white p-6 text-sm text-slate-600">
              No shortlists yet. Open compare on the properties page, then save a shortlist to start collaborating.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

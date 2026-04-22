"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { canManageProperties, useAuth } from "../../../lib/auth-context";
import { Visit } from "../../../types";

const visitStatuses = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export default function VisitsPage() {
  const { role, isReady } = useAuth();
  const [items, setItems] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canManage = canManageProperties(role);

  const patchVisit = async (visitId: number, updates: Partial<Pick<Visit, "status" | "notes" | "rating">>) => {
    try {
      const { data } = await api.patch(`/visits/${visitId}`, updates);
      setItems((current) => current.map((visit) => (visit.id === visitId ? data : visit)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update visit.");
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    let isActive = true;

    api
      .get("/visits", { signal: controller.signal })
      .then((response) => {
        if (isActive) setItems(response.data);
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Failed to load visits.");
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
  }, [isReady]);

  return (
    <div className="container py-10 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Visits</h1>
          <p className="text-sm text-slate-600">
            {canManage ? "Confirm requests and keep every site visit moving." : "Track scheduled visits and add notes once you are back home."}
          </p>
        </div>
        <Link href="/properties" className="text-sm text-brand">Explore more properties</Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading visits...</p>}
      {!loading && error && <p className="text-sm text-slate-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {items.map((visit) => (
            <article key={visit.id} className="bg-white border rounded-3xl p-5 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{visit.property.title}</p>
                  <p className="text-sm text-slate-500">{visit.property.location}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(visit.scheduledAt).toLocaleString()}</p>
                </div>
                {canManage ? (
                  <select
                    className="rounded-full border px-4 py-2 text-sm"
                    value={visit.status}
                    onChange={(event) => void patchVisit(visit.id, { status: event.target.value as Visit["status"] })}
                  >
                    {visitStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <span className="px-4 py-2 rounded-full bg-brand-soft text-brand text-sm font-medium">{visit.status.replace("_", " ")}</span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600">Agent: {visit.agent?.name || "Assigned shortly"}</p>
                  {!canManage && visit.agent?.email && <p className="text-slate-600">Contact: {visit.agent.email}</p>}
                  {visit.notes && <p className="text-slate-700">Notes: {visit.notes}</p>}
                </div>
                {!canManage && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Post-visit notes</label>
                    <textarea
                      rows={3}
                      defaultValue={visit.notes || ""}
                      className="w-full border rounded-xl px-3 py-2"
                      onBlur={(event) => {
                        if (event.target.value !== (visit.notes || "")) {
                          void patchVisit(visit.id, { notes: event.target.value });
                        }
                      }}
                    />
                    <label className="block text-sm text-slate-600">Rate this visit</label>
                    <select
                      className="rounded-full border px-4 py-2 text-sm"
                      value={visit.rating || ""}
                      onChange={(event) => void patchVisit(visit.id, { rating: Number(event.target.value) })}
                    >
                      <option value="">No rating yet</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                )}
              </div>
            </article>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No visits yet.</p>}
        </div>
      )}
    </div>
  );
}

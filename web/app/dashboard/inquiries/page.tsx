"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canManageProperties, useAuth } from "../../../lib/auth-context";
import { api } from "../../../lib/api";

type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  lastContactedAt?: string | null;
  createdAt: string;
  property?: {
    id: number;
    title: string;
    location: string;
  } | null;
};

export default function InquiriesPage() {
  const { role, isReady } = useAuth();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const canManage = canManageProperties(role);

  const updateStatus = async (id: number, status: string) => {
    try {
      const { data } = await api.patch(`/users/inquiries/${id}`, { status });
      setItems((current) => current.map((item) => (item.id === id ? data : item)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update inquiry");
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    let isActive = true;

    api
      .get("/users/inquiries", { signal: controller.signal })
      .then((response) => {
        if (isActive) setItems(response.data);
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Failed to load inquiries");
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
      <div>
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-sm text-slate-600">Recent conversations and lead submissions linked to your account scope.</p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading inquiries...</p>}
      {!loading && error && <p className="text-sm text-slate-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="bg-white border rounded-2xl p-5 space-y-2">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.email}{item.phone ? ` • ${item.phone}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  {canManage ? (
                    <select
                      className="rounded-lg border px-3 py-2 text-xs"
                      value={item.status}
                      onChange={(event) => void updateStatus(item.id, event.target.value)}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="VISIT_SCHEDULED">VISIT_SCHEDULED</option>
                      <option value="NEGOTIATING">NEGOTIATING</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="LOST">LOST</option>
                    </select>
                  ) : (
                    <span className="text-xs uppercase tracking-wide text-brand bg-brand-soft px-3 py-1 rounded-full">
                      {item.status.replace("_", " ")}
                    </span>
                  )}
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700">{item.message}</p>
              {item.lastContactedAt && <p className="text-xs text-slate-500">Last touched {new Date(item.lastContactedAt).toLocaleString()}</p>}
              {item.property ? (
                <Link href={`/properties/${item.property.id}`} className="text-sm text-brand">
                  {item.property.title} • {item.property.location}
                </Link>
              ) : (
                <p className="text-xs uppercase tracking-wide text-slate-500">General inquiry</p>
              )}
            </article>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No inquiries yet.</p>}
        </div>
      )}
    </div>
  );
}

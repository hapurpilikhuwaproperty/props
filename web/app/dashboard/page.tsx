"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canManageProperties, useAuth } from "../../lib/auth-context";
import { AgentScorecard, Property, Visit } from "../../types";
import { api } from "../../lib/api";

type DashboardData = {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  stats: {
    favorites: number;
    inquiries: number;
    listings: number;
    users: number;
    verifiedListings: number;
    staleListings: number;
    openInquiries: number;
    scheduledVisits: number;
    upcomingVisits: number;
  };
  recentListings: Property[];
  recentInquiries: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    status: string;
    createdAt: string;
    property?: {
      id: number;
      title: string;
      location: string;
    } | null;
  }>;
  recentVisits: Visit[];
};

export default function DashboardPage() {
  const { role, isReady } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [scorecard, setScorecard] = useState<AgentScorecard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const canManage = canManageProperties(role);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    let isActive = true;

    setLoading(true);
    setError("");

    const loadDashboard = async () => {
      try {
        const response = await api.get("/users/dashboard", { signal: controller.signal });
        if (!isActive) return;
        setData(response.data);
        if (role === "agent" || role === "admin") {
          try {
            const { data: nextScorecard } = await api.get("/users/scorecard", { signal: controller.signal });
            if (!isActive) return;
            setScorecard(nextScorecard);
          } catch {
            if (isActive) {
              setScorecard(null);
            }
          }
        }
      } catch (err: any) {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Failed to load dashboard");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isReady, role]);

  if (loading) {
    return <div className="container py-12 text-sm text-slate-500">Loading dashboard...</div>;
  }

  if (error || !data) {
    return <div className="container py-12 text-sm text-slate-600">{error || "Dashboard unavailable."}</div>;
  }

  return (
    <div className="container py-12 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold mt-2">Welcome back, {data.user.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Signed in as {data.user.role}. {canManage ? "Track listings and incoming leads." : "Track favorites and account activity."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canManage && (
            <Link href="/dashboard/properties/new" className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">
              + Add property
            </Link>
          )}
          <Link href={canManage ? "/dashboard/leads" : "/dashboard/inquiries"} className="px-4 py-2 rounded-lg border font-medium">
            View {canManage ? "leads" : "inquiries"}
          </Link>
          <Link href="/dashboard/shortlists" className="px-4 py-2 rounded-lg border font-medium">
            Shared shortlists
          </Link>
          <Link href="/dashboard/visits" className="px-4 py-2 rounded-lg border font-medium">
            View visits
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Favorites</p>
          <p className="text-3xl font-semibold mt-2">{data.stats.favorites}</p>
          <p className="text-xs text-slate-500 mt-1">Saved properties tracked per account.</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Inquiries</p>
          <p className="text-3xl font-semibold mt-2">{data.stats.inquiries}</p>
          <p className="text-xs text-slate-500 mt-1">{canManage ? `${data.stats.openInquiries} open and ${data.stats.scheduledVisits} visit-ready.` : "Conversations linked to your account."}</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Listings</p>
          <p className="text-3xl font-semibold mt-2">{data.stats.listings}</p>
          <p className="text-xs text-slate-500 mt-1">{canManage ? `${data.stats.verifiedListings} verified, ${data.stats.staleListings} stale.` : "Publishing is enabled for agent and admin roles."}</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">{isAdmin ? "Users" : "Visits"}</p>
          <p className="text-3xl font-semibold mt-2">{isAdmin ? data.stats.users : data.stats.upcomingVisits}</p>
          <p className="text-xs text-slate-500 mt-1">{isAdmin ? "Total accounts in this workspace." : "Upcoming site visits on your calendar."}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{canManage ? "Recent listings" : "Recommended next steps"}</h2>
            {canManage && <Link href="/dashboard/leads" className="text-sm text-brand">See all</Link>}
          </div>
          {canManage ? (
            data.recentListings.length > 0 ? (
              <div className="space-y-3">
                {data.recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-slate-500">{listing.location}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {listing.verified ? "Verified" : listing.verificationLevel?.replace("_", " ")} • Score {listing.qualityScore}/100 • {listing.inquiryCount} leads
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-accent">₹{Number(listing.price).toLocaleString("en-IN")}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{listing.status} • {listing.freshnessDays ?? 0}d fresh</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No listings yet. Add your first property to start collecting leads.</p>
            )
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              <p>Browse listings, shortlist favorites, and submit inquiries to agents directly from property pages.</p>
              <div className="flex gap-3">
                <Link href="/properties" className="px-4 py-2 rounded-lg bg-brand text-white font-medium">Explore properties</Link>
                <Link href="/dashboard/inquiries" className="px-4 py-2 rounded-lg border font-medium">View activity</Link>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{canManage ? "Recent leads" : "Recent inquiries"}</h2>
            <Link href="/dashboard/inquiries" className="text-sm text-brand">Open inbox</Link>
          </div>
          {data.recentInquiries.length > 0 ? (
            <div className="space-y-3">
              {data.recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="rounded-xl border border-slate-100 p-4 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{inquiry.name}</p>
                    <p className="text-xs text-slate-500">{inquiry.status.replace("_", " ")} • {new Date(inquiry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-slate-500">{inquiry.email}{inquiry.phone ? ` • ${inquiry.phone}` : ""}</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{inquiry.message}</p>
                  {inquiry.property && (
                    <Link href={`/properties/${inquiry.property.id}`} className="text-xs text-brand">
                      {inquiry.property.title} • {inquiry.property.location}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No inquiry activity yet.</p>
          )}
        </section>
      </div>

      <section className="bg-white border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming visits</h2>
          <Link href="/dashboard/visits" className="text-sm text-brand">Manage visits</Link>
        </div>
        {data.recentVisits.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recentVisits.map((visit) => (
              <div key={visit.id} className="rounded-xl border border-slate-100 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{visit.property.title}</p>
                  <span className="text-xs px-3 py-1 rounded-full bg-brand-soft text-brand">{visit.status.replace("_", " ")}</span>
                </div>
                <p className="text-sm text-slate-500">{visit.property.location}</p>
                <p className="text-sm text-slate-700">{new Date(visit.scheduledAt).toLocaleString()}</p>
                {canManage ? (
                  <p className="text-xs text-slate-500">Buyer: {visit.user?.name || "Assigned buyer"}</p>
                ) : (
                  <p className="text-xs text-slate-500">Agent: {visit.agent?.name || "Assigned shortly"}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No visits on the calendar yet.</p>
        )}
      </section>

      {canManage && scorecard && (
        <section className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Agent scorecard</h2>
            <span className="text-sm text-slate-500">Operational quality snapshot</span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Responsiveness</p>
              <p className="text-2xl font-semibold mt-2">{scorecard.stats.responsivenessScore}/100</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Visit conversion</p>
              <p className="text-2xl font-semibold mt-2">{scorecard.stats.conversionRate}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Listing quality</p>
              <p className="text-2xl font-semibold mt-2">{scorecard.stats.averageQuality}/100</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Visit rating</p>
              <p className="text-2xl font-semibold mt-2">{scorecard.stats.averageVisitRating ?? "NA"}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            {scorecard.badges.map((badge) => <p key={badge}>• {badge}</p>)}
          </div>
        </section>
      )}

    </div>
  );
}

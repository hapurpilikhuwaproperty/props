"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompare } from "../lib/compare-context";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";

const estimateEmi = (price: number) => {
  const monthlyRate = 0.075 / 12;
  const tenure = 240;
  const principal = price * 0.8;
  return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1));
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export default function CompareSheet() {
  const { items, clear, remove } = useCompare();
  const { isAuthed, isReady } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const computed = useMemo(
    () =>
      items.map((property) => {
        const price = Number(property.price);
        const area = property.areaSqFt ? Number(property.areaSqFt) : null;
        const pricePerSqFt = area ? Math.round(price / area) : null;
        const emi = estimateEmi(price);
        return {
          ...property,
          price,
          area,
          pricePerSqFt,
          emi,
        };
      }),
    [items],
  );

  const cheapestId = computed.reduce<number | null>((best, item) => (best === null || item.price < (computed.find((entry) => entry.id === best)?.price || Infinity) ? item.id : best), null);
  const largestId = computed.reduce<number | null>((best, item) => (best === null || (item.area || 0) > (computed.find((entry) => entry.id === best)?.area || 0) ? item.id : best), null);
  const lowestEmiId = computed.reduce<number | null>((best, item) => (best === null || item.emi < (computed.find((entry) => entry.id === best)?.emi || Infinity) ? item.id : best), null);
  const highestScoreId = computed.reduce<number | null>((best, item) => (best === null || (item.qualityScore || 0) > (computed.find((entry) => entry.id === best)?.qualityScore || 0) ? item.id : best), null);

  const shareCompare = async () => {
    const text = computed
      .map((item) => `${item.title} | ${formatCurrency(item.price)} | ${item.location} | score ${item.qualityScore ?? 0}/100`)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Property comparison",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setMessage("Comparison copied.");
      }
    } catch {
      setMessage("Unable to share comparison.");
    }
  };

  const saveShortlist = async () => {
    if (!isReady) return;
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent("/dashboard/shortlists")}`);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const shortlistName =
        computed.length === 1
          ? `${computed[0].title} shortlist`
          : `${computed[0].localityName || computed[0].location} decision set`;
      const { data } = await api.post("/shortlists", {
        name: shortlistName,
        propertyIds: computed.map((item) => item.id),
      });
      clear();
      setOpen(false);
      router.push(`/shortlists/${data.shareToken}`);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Unable to save shortlist.");
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full p-6 overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold">Compare serious options</h3>
                <p className="text-sm text-slate-500">Spot value, trust, and affordability before you schedule visits or start a shared shortlist.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={saveShortlist} disabled={saving} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium disabled:opacity-60">
                  {saving ? "Saving..." : "Save shortlist"}
                </button>
                <button onClick={shareCompare} className="px-4 py-2 rounded-full border text-sm font-medium">Share summary</button>
                <button onClick={clear} className="px-4 py-2 rounded-full border text-sm font-medium">Clear</button>
                <button onClick={() => setOpen(false)} className="text-xl px-3">×</button>
              </div>
            </div>
            {message && <p className="text-sm text-brand mb-4">{message}</p>}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(240px, 1fr))` }}>
              {computed.map((property) => (
                <div key={property.id} className="border rounded-3xl p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-2">{property.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{property.location}</p>
                    </div>
                    <button onClick={() => remove(property.id)} className="text-xs text-slate-500 underline">Remove</button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {property.id === cheapestId && <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Best value</span>}
                    {property.id === largestId && <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-700">Largest</span>}
                    {property.id === lowestEmiId && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Lowest EMI</span>}
                    {property.id === highestScoreId && <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700">Highest trust</span>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Price</span><span className="font-semibold">{formatCurrency(property.price)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">EMI estimate</span><span>{formatCurrency(property.emi)}/mo</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Area</span><span>{property.area ? `${property.area.toLocaleString()} sqft` : "On request"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Price / sqft</span><span>{property.pricePerSqFt ? formatCurrency(property.pricePerSqFt) : "On request"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Trust score</span><span>{property.qualityScore ?? 0}/100</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Verification</span><span>{property.verified ? "Verified" : property.verificationLevel?.replace("_", " ")}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Response</span><span>{property.responseTimeHours ? `${property.responseTimeHours}h` : "Not set"}</span></div>
                  </div>
                  <Link href={`/properties/${property.id}`} className="inline-flex px-4 py-2 rounded-full bg-brand text-white text-sm font-medium">
                    Open detail
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-brand text-white rounded-full text-sm shadow">
        Open compare
      </button>
    </>
  );
}

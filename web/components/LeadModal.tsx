"use client";
import { useState } from "react";
import { api } from "../lib/api";

type Props = {
  triggerClassName?: string;
  triggerLabel?: string;
  propertyId?: number;
};

export default function LeadModal({ triggerClassName = "", triggerLabel = "Talk to an expert", propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string | number> = Object.fromEntries(form.entries()) as Record<string, string>;
    if (propertyId) payload.propertyId = propertyId;
    setSubmitting(true);
    setMsg("");
    try {
      // analytics hook
      if (typeof window !== "undefined") {
        import("../lib/analytics").then(({ trackEvent }) => trackEvent("lead_submit", payload as any));
      }
      await api.post("/leads", payload);
      setMsg("Thank you! We will call you within 2 hours.");
      e.currentTarget.reset();
    } catch (err) {
      setMsg("Something went wrong. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`bg-brand text-white px-4 py-2 rounded-full shadow-lg hover:-translate-y-0.5 transition ${triggerClassName}`}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Schedule a call</h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-800">×</button>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input name="name" required placeholder="Full name" className="w-full border rounded-lg px-3 py-2" />
              <input name="email" type="email" required placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
              <input name="phone" required placeholder="Phone" className="w-full border rounded-lg px-3 py-2" />
              <input name="city" placeholder="Preferred city" className="w-full border rounded-lg px-3 py-2" />
              <textarea name="note" rows={3} placeholder="Tell us what you’re looking for" className="w-full border rounded-lg px-3 py-2" />
              {msg && <p className="text-sm text-brand">{msg}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold">
                  {submitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

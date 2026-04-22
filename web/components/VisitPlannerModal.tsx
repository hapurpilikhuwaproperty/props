"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { canManageProperties, useAuth } from "../lib/auth-context";

type Props = {
  propertyId: number;
};

const defaultDateTime = () => {
  const value = new Date(Date.now() + 48 * 60 * 60 * 1000);
  value.setMinutes(0, 0, 0);
  return value.toISOString().slice(0, 16);
};

export default function VisitPlannerModal({ propertyId }: Props) {
  const router = useRouter();
  const { isAuthed, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(defaultDateTime());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isManager = canManageProperties(role);

  const startFlow = () => {
    if (!isAuthed) {
      router.push(`/auth/login?next=/properties/${propertyId}`);
      return;
    }
    if (isManager) {
      setMessage("Use a buyer account to request a site visit.");
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      await api.post("/visits", {
        propertyId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes,
      });
      setMessage("Visit request sent. Track status from your dashboard.");
      setNotes("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to schedule visit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={startFlow} className="w-full rounded-full border px-4 py-2 font-medium hover:border-brand hover:text-brand transition">
        Schedule site visit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Plan your site visit</h3>
                <p className="text-sm text-slate-500">Choose a visit slot and share anything the agent should prepare.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-xl px-2">×</button>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-slate-600">Preferred date and time</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-slate-600">Notes for the visit</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Examples: parking access, nearby schools, possession timeline, payment plan."
              />
            </label>

            {message && <p className="text-sm text-brand">{message}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border">Cancel</button>
              <button onClick={() => void submit()} disabled={submitting} className="px-4 py-2 rounded-full bg-brand text-white font-medium">
                {submitting ? "Saving..." : "Request visit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

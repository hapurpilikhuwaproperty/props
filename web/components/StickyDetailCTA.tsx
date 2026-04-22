"use client";
import LeadModal from "./LeadModal";

export default function StickyDetailCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">Need price breakup or a site visit?</p>
        <p className="text-xs text-slate-600">We’ll arrange a call within 2 hours.</p>
      </div>
      <div className="flex gap-2">
        <a href="tel:+911234567890" className="px-4 py-2 border rounded-full text-sm">Call now</a>
        <LeadModal triggerLabel="Schedule visit" />
      </div>
    </div>
  );
}


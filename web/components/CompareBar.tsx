"use client";
import CompareSheet from "./CompareSheet";
import { useCompare } from "../lib/compare-context";

export default function CompareBar() {
  const { items, clear } = useCompare();
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white shadow-2xl border rounded-2xl px-4 py-3 flex items-center gap-3 max-w-[min(92vw,900px)]">
      <div>
        <p className="text-sm font-semibold">Compare ({items.length}/4)</p>
        <p className="text-xs text-slate-500">Best used once you shortlist serious options.</p>
      </div>
      <div className="flex gap-2 text-xs flex-wrap">
        {items.map((p) => (
          <span key={p.id} className="px-2 py-1 bg-slate-100 rounded-full">{p.title.slice(0, 18)}...</span>
        ))}
      </div>
      <CompareSheet />
      <button onClick={clear} className="text-xs text-slate-500 underline">Clear</button>
    </div>
  );
}

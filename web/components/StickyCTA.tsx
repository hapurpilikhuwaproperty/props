"use client";
import LeadModal from './LeadModal';
import Link from 'next/link';

export default function StickyCTA() {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      <LeadModal triggerLabel="Talk to an expert" />
      <Link href="/dashboard/properties/new" className="bg-white text-brand px-4 py-2 rounded-full shadow border text-sm font-semibold">
        List your property
      </Link>
    </div>
  );
}


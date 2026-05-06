"use client";
import { PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';
import LeadModal from './LeadModal';
import Link from 'next/link';

export default function StickyCTA() {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      <LeadModal
        triggerLabel="Talk to an expert"
        triggerAriaLabel="Talk to an expert"
        triggerClassName="grid h-14 w-14 place-items-center p-0"
        triggerContent={<PhoneIcon className="h-6 w-6" aria-hidden="true" />}
      />
      <Link
        href="/dashboard/properties/new"
        aria-label="List your property"
        title="List your property"
        className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-brand shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50"
      >
        <PlusIcon className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">List your property</span>
      </Link>
    </div>
  );
}

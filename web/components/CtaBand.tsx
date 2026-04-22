import LeadModal from './LeadModal';

export default function CtaBand() {
  return (
    <section className="container my-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-slate-900 text-white p-10 md:p-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="max-w-xl space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-accent">Need help?</p>
          <h3 className="text-3xl font-semibold">Get a curated shortlist in 24 hours.</h3>
          <p className="text-slate-200">Tell us your vibe, budget, and move-in date. Our agents will shortlist 5 homes and schedule viewings.</p>
        </div>
        <LeadModal triggerLabel="Get shortlist" />
      </div>
    </section>
  );
}

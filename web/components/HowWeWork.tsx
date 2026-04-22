const steps = [
  { title: "Discover", desc: "Tell us city, budget, move-in timeline." },
  { title: "Shortlist", desc: "We curate 5–7 options with paperwork vetted." },
  { title: "Site visit", desc: "Guided tours + virtual walkthroughs." },
  { title: "Close", desc: "Offers, loan, registry, and handover support." },
];

export default function HowWeWork() {
  return (
    <section className="bg-white py-12">
      <div className="container space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">How we work</p>
          <h3 className="text-2xl font-semibold">A single lane from search to close</h3>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {steps.map((s, idx) => (
            <div key={s.title} className="border rounded-2xl p-4 bg-slate-50">
              <p className="text-brand font-semibold mb-1">{idx + 1}. {s.title}</p>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


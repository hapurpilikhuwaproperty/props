const faqs = [
  { q: "Is the project RERA approved?", a: "Yes, all listings displayed are RERA verified or paperwork-checked." },
  { q: "Do you help with home loans?", a: "Yes, we facilitate loans with leading banks and assist with documentation." },
  { q: "Can I schedule virtual site visits?", a: "Absolutely—HD walkthroughs and live agent-led video tours are available." },
  { q: "Do you charge brokerage?", a: "For primary sales we are builder-funded; for resale/lease brokerage may apply." },
];

export default function FAQ() {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
      <p className="font-semibold">FAQs</p>
      <div className="space-y-2">
        {faqs.map((f) => (
          <details key={f.q} className="border rounded-lg px-3 py-2 bg-slate-50">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="text-sm text-slate-600 mt-1">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}


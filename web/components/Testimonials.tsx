const testimonials = [
  {
    quote: "Smooth experience from shortlist to possession. Transparent and quick.",
    name: "Akriti G.",
    role: "Homeowner, Gurgaon",
  },
  {
    quote: "Their agents understood our brief and curated only relevant options.",
    name: "Saurabh M.",
    role: "Investor, Pune",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-slate-50 py-14">
      <div className="container space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Testimonials</p>
          <h3 className="text-2xl font-semibold">Happy Homeowners Speak Out</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white border rounded-2xl p-5 shadow-sm">
              <p className="text-slate-700 leading-relaxed">“{t.quote}”</p>
              <p className="mt-3 font-semibold text-brand">{t.name}</p>
              <p className="text-sm text-slate-500">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


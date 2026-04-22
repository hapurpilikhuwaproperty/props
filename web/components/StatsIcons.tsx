const stats = [
  { title: "Approvals", desc: "Clear RERA & sanctions" },
  { title: "Site Visits", desc: "Curated, guided tours" },
  { title: "Financing", desc: "Home loan assistance" },
  { title: "Interiors", desc: "Design-to-delivery" },
];

export default function StatsIcons() {
  return (
    <section className="bg-white py-10">
      <div className="container grid gap-6 md:grid-cols-4 text-center">
        {stats.map((s) => (
          <div key={s.title} className="p-4 border rounded-2xl shadow-sm bg-white">
            <p className="font-semibold text-brand">{s.title}</p>
            <p className="text-sm text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


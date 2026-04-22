export default function TrustBar() {
  const stats = [
    { label: "Site visits arranged", value: "2,400+" },
    { label: "Verified projects", value: "320+" },
    { label: "Avg. response time", value: "2h" },
    { label: "Agent rating", value: "4.8/5" },
  ];
  return (
    <section className="bg-white py-6 border-b">
      <div className="container grid grid-cols-2 md:grid-cols-4 text-center gap-4">
        {stats.map((s) => (
          <div key={s.label} className="space-y-1">
            <p className="text-xl font-semibold text-brand">{s.value}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


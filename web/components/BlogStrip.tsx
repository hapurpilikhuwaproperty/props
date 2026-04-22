const posts = [
  { title: "How to evaluate a new launch", date: "Apr 2026" },
  { title: "Checklist for registry & possession", date: "Mar 2026" },
  { title: "Top micromarkets to watch", date: "Feb 2026" },
];

export default function BlogStrip() {
  return (
    <section className="bg-slate-50 py-12">
      <div className="container space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Insights & Guides</h3>
          <a href="#" className="text-sm text-brand">View all</a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {posts.map((p) => (
            <div key={p.title} className="bg-white border rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500">{p.date}</p>
              <p className="font-semibold mt-1">{p.title}</p>
              <a className="text-sm text-brand mt-2 inline-block" href="#">Read more</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


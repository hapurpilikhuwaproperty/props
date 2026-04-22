const categories = [
  { name: 'Ready to Move', description: 'Keys in hand, zero wait time.' },
  { name: 'New Launch', description: 'Pre-launch offers from top builders.' },
  { name: 'Residential', description: 'Apartments, villas, plotted developments.' },
  { name: 'Commercial', description: 'Offices, showrooms, co-working floors.' },
];

export default function Categories() {
  return (
    <section className="container py-14 grid gap-6 md:grid-cols-4">
      {categories.map((cat) => (
        <div key={cat.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="font-semibold">{cat.name}</p>
          <p className="text-sm text-slate-500 mt-2">{cat.description}</p>
        </div>
      ))}
    </section>
  );
}

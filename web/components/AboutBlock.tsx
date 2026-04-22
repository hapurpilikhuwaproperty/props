import { BRAND } from '../lib/constants';

export default function AboutBlock() {
  return (
    <section className="bg-white py-12">
      <div className="container grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">About Us</p>
          <h3 className="text-2xl font-semibold mt-2">{BRAND.ABOUT_HEADLINE}</h3>
          <p className="mt-3 text-slate-700 leading-relaxed">
            We curate residences across metro hubs with a focus on clarity, legality, and experience. From discovery to
            move-in, our agents, financing partners, and interior network keep your journey predictable.
          </p>
          <a href="/about" className="inline-block mt-4 px-4 py-2 border border-brand text-brand rounded-full text-sm">Explore More</a>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl shadow-sm">
          <p className="font-semibold text-brand mb-2">Why choose us</p>
          <ul className="space-y-2 text-slate-700 text-sm">
            <li>✓ Vetted projects with clean paperwork</li>
            <li>✓ Guided site visits and virtual tours</li>
            <li>✓ Home loan assistance with leading banks</li>
            <li>✓ Interior partners for turnkey delivery</li>
          </ul>
          <div className="grid grid-cols-2 gap-3 mt-4 text-center text-sm">
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-semibold text-brand">320+</p>
              <p className="text-slate-600">Verified projects</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-semibold text-brand">2,400+</p>
              <p className="text-slate-600">Site visits</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-semibold text-brand">48h</p>
              <p className="text-slate-600">Avg response</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xl font-semibold text-brand">4.8/5</p>
              <p className="text-slate-600">Agent rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

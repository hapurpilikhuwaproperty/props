import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyCard from '../../../components/PropertyCard';
import { LocalityInsight } from '../../../types';
import { getServerJson, ServerApiError } from '../../../lib/server-api';

async function fetchLocality(slug: string): Promise<LocalityInsight> {
  return getServerJson<LocalityInsight>(`/intelligence/localities/${slug}`, { revalidate: 300 });
}

export default async function LocalityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let locality: LocalityInsight;

  try {
    locality = await fetchLocality(slug);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="container py-12 space-y-8">
      <div className="space-y-3">
        <Link href="/properties" className="text-sm text-brand">Back to properties</Link>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Locality intelligence</p>
        <h1 className="text-3xl font-semibold">{locality.name}</h1>
        <p className="text-slate-600 max-w-3xl">{locality.headline}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Listings</p>
          <p className="text-3xl font-semibold mt-2">{locality.stats.listingCount}</p>
          <p className="text-xs text-slate-500 mt-1">{locality.stats.availableCount} currently available.</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg. price</p>
          <p className="text-3xl font-semibold mt-2">₹{locality.stats.averagePrice.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">₹{locality.stats.averagePricePerSqFt.toLocaleString('en-IN')}/sqft.</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Livability</p>
          <p className="text-3xl font-semibold mt-2">{locality.livabilityScore}/100</p>
          <p className="text-xs text-slate-500 mt-1">Rental demand {locality.rentalDemandScore}/100.</p>
        </div>
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Market confidence</p>
          <p className="text-3xl font-semibold mt-2">{locality.stats.averageQuality}/100</p>
          <p className="text-xs text-slate-500 mt-1">
            {locality.stats.inquiryVelocity} inquiry signals • {locality.stats.collaborationSignals} shortlist saves.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Why this market works</h2>
          <p className="text-slate-700">{locality.marketPulse}</p>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="font-semibold mb-2">Buyer fit</p>
              <div className="space-y-2 text-slate-700">
                {locality.buyerTypes.map((item) => <p key={item}>• {item}</p>)}
              </div>
            </div>
            <div>
              <p className="font-semibold mb-2">Transit cues</p>
              <div className="space-y-2 text-slate-700">
                {locality.transit.map((item) => <p key={item}>• {item}</p>)}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold">Commute reality</p>
              <p className="text-slate-600 mt-2">{locality.commuteSummary}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold">Price momentum</p>
              <p className="text-slate-600 mt-2">{locality.priceMomentum}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold">Yield outlook</p>
              <p className="text-slate-600 mt-2">{locality.yieldOutlook}</p>
            </div>
          </div>
        </section>
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Everyday essentials</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold">Schools</p>
              <p>{locality.schools.join(' • ')}</p>
            </div>
            <div>
              <p className="font-semibold">Hospitals</p>
              <p>{locality.hospitals.join(' • ')}</p>
            </div>
            <div>
              <p className="font-semibold">Top agents</p>
              <div className="space-y-2">
                {locality.topAgents.map((agent) => (
                  <p key={agent.id}>{agent.name} • {agent.listingCount} listings • quality {agent.averageQuality}/100</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Infra and decision signals</h2>
          <div className="space-y-3 text-sm text-slate-700">
            {locality.infraSignals.map((item) => <p key={item}>• {item}</p>)}
          </div>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="font-semibold">Verification rate</p>
              <p className="text-slate-600 mt-2">{locality.stats.verificationRate}% of visible inventory is verified.</p>
            </div>
            <div>
              <p className="font-semibold">Response rhythm</p>
              <p className="text-slate-600 mt-2">
                {locality.stats.averageResponseHours ? `${locality.stats.averageResponseHours}h typical response time.` : "Response timing is still sparse."}
              </p>
            </div>
          </div>
        </section>
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">What to verify on-site</h2>
          <div className="space-y-3 text-sm text-slate-700">
            {locality.watchouts.map((item) => <p key={item}>• {item}</p>)}
          </div>
          <p className="text-sm text-slate-600">{locality.walkability}</p>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live inventory</p>
          <h2 className="text-2xl font-semibold">Projects in {locality.name}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locality.properties.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>
      </section>
    </div>
  );
}

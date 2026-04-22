import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LocalityInsight, Property } from '../../../types';
import LeadModal from '../../../components/LeadModal';
import Lightbox from '../../../components/Lightbox';
import StickyDetailCTA from '../../../components/StickyDetailCTA';
import FAQ from '../../../components/FAQ';
import VisitPlannerModal from '../../../components/VisitPlannerModal';
import { getServerJson, ServerApiError } from '../../../lib/server-api';

async function fetchProperty(id: string): Promise<Property> {
  return getServerJson<Property>(`/properties/${id}`, { revalidate: 300 });
}

async function fetchLocality(slug?: string): Promise<LocalityInsight | null> {
  if (!slug) return null;
  try {
    return await getServerJson<LocalityInsight>(`/intelligence/localities/${slug}`, { revalidate: 300 });
  } catch {
    return null;
  }
}

const estimateEmi = (price: number) => {
  const monthlyRate = 0.075 / 12;
  const tenure = 240;
  const principal = price * 0.8;
  return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1));
};

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let property: Property;

  try {
    property = await fetchProperty(id);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const locality = await fetchLocality(property.localitySlug);
  const cover = property.images.find((i) => i.isCover) || property.images[0];
  const price = Number(property.price);
  const area = property.areaSqFt ? Number(property.areaSqFt) : null;
  const pricePerSqFt = area ? Math.round(price / area) : null;
  const amenityList = property.amenities || [];
  const verificationText = property.verified ? 'Verified listing' : (property.verificationLevel || 'BASIC').replace('_', ' ');
  const freshnessText = typeof property.freshnessDays === 'number' ? `${property.freshnessDays} days ago` : 'Recently refreshed';
  const emi = estimateEmi(price);
  const downPayment = Math.round(price * 0.2);
  const closingCosts = Math.round(price * 0.08);
  const negotiationFloor = Math.round(price * (property.verified ? 0.96 : 0.92));
  const negotiationCeiling = Math.round(price * 0.98);
  const buyerFit = [
    property.bedrooms >= 3 ? 'Strong fit for family living' : 'Better for couples or compact households',
    property.type === 'APARTMENT' ? 'Good for low-maintenance end use' : 'Works well if you want more customization',
    property.responseTimeHours && property.responseTimeHours <= 2 ? 'Fast response makes scheduling easier' : 'Expect slower back-and-forth before decisions',
  ];
  const verifyNext = [
    property.verified ? 'Review the final allotment and payment schedule.' : 'Ask for document pack and title trail before paying a token.',
    property.latitude != null ? 'Drive the commute once during peak traffic.' : 'Confirm the exact tower or plot location before the visit.',
    property.listingSource === 'BUILDER' ? 'Compare builder payment plan against bank disbursement.' : 'Confirm who holds signing authority for the seller side.',
  ];

  return (
    <div className="container py-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <Link href="/properties" className="hover:text-brand">Properties</Link>
          <span>•</span>
          <span>{property.location}</span>
          <span>•</span>
          <span>{property.status}</span>
        </div>
        <div className="flex gap-4 text-sm text-slate-600 overflow-x-auto pb-2">
          <a href="#overview" className="px-3 py-1 rounded-full border">Overview</a>
          <a href="#amenities" className="px-3 py-1 rounded-full border">Amenities</a>
          <a href="#location" className="px-3 py-1 rounded-full border">Location</a>
          <a href="#gallery" className="px-3 py-1 rounded-full border">Gallery</a>
        </div>
        {cover && (
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
            <Image src={cover.url} alt={property.title} fill className="object-cover" />
          </div>
        )}
        <div id="gallery">
          <Lightbox images={property.images} />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-3" id="overview">
          <h1 className="text-3xl font-semibold">{property.title}</h1>
          <p className="text-brand-accent text-xl font-semibold">₹{price.toLocaleString('en-IN')}</p>
          <p className="text-slate-600">{property.location}</p>
          <div className="flex gap-4 text-sm text-slate-700">
            <span>{property.bedrooms} bed</span>
            <span>{property.bathrooms} bath</span>
            <span className="capitalize">{property.type.toLowerCase()}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Availability</p>
              <p className="font-semibold mt-1">{property.status}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Area</p>
              <p className="font-semibold mt-1">{area ? `${area.toLocaleString()} sqft` : 'On request'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Price / sqft</p>
              <p className="font-semibold mt-1">{pricePerSqFt ? `₹${pricePerSqFt.toLocaleString('en-IN')}` : 'On request'}</p>
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed">{property.description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Verification</p>
            <p className="font-semibold mt-2">{verificationText}</p>
            <p className="text-sm text-slate-600 mt-1">
              Source: {(property.listingSource || 'AGENT').replace('_', ' ')} • last reviewed {freshnessText}.
            </p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Listing quality</p>
            <p className="font-semibold mt-2">{property.qualityScore || 0}/100 confidence score</p>
            <p className="text-sm text-slate-600 mt-1">Score reflects listing completeness, media quality, and verification depth.</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Response time</p>
            <p className="font-semibold mt-2">Within {property.responseTimeHours || 4} hours</p>
            <p className="text-sm text-slate-600 mt-1">Direct agent follow-up during working hours with site-visit support.</p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5" id="amenities">
          <p className="font-semibold mb-2">Amenities</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-700">
            {amenityList.map((a) => (
              <span key={a.amenity.id} className="px-3 py-1 bg-brand-soft rounded-full">{a.amenity.name}</span>
            ))}
            {amenityList.length === 0 && <span className="text-slate-500 text-sm">No amenities listed.</span>}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
            <p className="font-semibold">Decision guide</p>
            <div className="space-y-2 text-sm text-slate-700">
              {buyerFit.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
            <p className="font-semibold">Verify before token payment</p>
            <div className="space-y-2 text-sm text-slate-700">
              {verifyNext.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3" id="location">
          <p className="font-semibold mb-1">Location</p>
          {property.latitude && property.longitude ? (
            <iframe
              className="w-full h-64 rounded-2xl border"
              loading="lazy"
              src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY || ''}&center=${property.latitude},${property.longitude}&zoom=14`}
              allowFullScreen
            />
          ) : (
            <p className="text-sm text-slate-500">Location map not available.</p>
          )}
          {locality ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">{locality.commuteSummary}</p>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Livability</p>
                  <p className="font-semibold">{locality.livabilityScore}/100</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Rental demand</p>
                  <p className="font-semibold">{locality.rentalDemandScore}/100</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Locality avg. quality</p>
                  <p className="font-semibold">{locality.stats.averageQuality}/100</p>
                </div>
              </div>
              <Link href={`/localities/${locality.slug}`} className="inline-flex text-sm text-brand font-medium">
                Open {locality.name} locality guide
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nearby: schools, hospitals, transit within 3km.</p>
          )}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <p className="font-semibold">Book a viewing</p>
          <p className="text-sm text-slate-600">Share your timing and preferred call-back window, or lock a visit request directly from your buyer dashboard.</p>
          <LeadModal triggerLabel="Send inquiry" triggerClassName="w-full text-center" propertyId={property.id} />
          <VisitPlannerModal propertyId={property.id} />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <p className="font-semibold">Affordability snapshot</p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Estimated EMI</span><span>{`₹${emi.toLocaleString()}/mo`}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Suggested down payment</span><span>{`₹${downPayment.toLocaleString()}`}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Closing cost reserve</span><span>{`₹${closingCosts.toLocaleString()}`}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Negotiation range</span><span>{`₹${negotiationFloor.toLocaleString()} - ₹${negotiationCeiling.toLocaleString()}`}</span></div>
          </div>
          <p className="text-xs text-slate-500">Based on 20% down payment, 7.5% interest, 20-year tenure, and 8% acquisition costs.</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <p className="font-semibold mb-2">Agent</p>
          <div className="text-sm text-slate-700 space-y-1">
            <p className="font-medium">{property.agent?.name || 'Dedicated advisor'}</p>
          </div>
          <p className="text-sm text-slate-700">
            Dedicated advisor support is available through the inquiry and visit request flows, with a typical response within {property.responseTimeHours || 4} hours.
          </p>
          <LeadModal triggerLabel="Schedule a call" propertyId={property.id} />
        </div>
        <FAQ />
      </aside>
      <StickyDetailCTA />
    </div>
  );
}

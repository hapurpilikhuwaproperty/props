import Link from 'next/link';
import PropertyCard from '../../components/PropertyCard';
import { LocalitySummary, Property } from '../../types';
import { getServerJson } from '../../lib/server-api';

type ListingResponse = {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
};

async function fetchProperties(params: Record<string, string | string[] | undefined>): Promise<ListingResponse> {
  return getServerJson<ListingResponse>('/properties', {
    params: { pageSize: 12, ...params },
    revalidate: 300,
  });
}

async function fetchLocalities(): Promise<LocalitySummary[]> {
  try {
    return await getServerJson<LocalitySummary[]>('/intelligence/localities', { revalidate: 300 });
  } catch {
    return [];
  }
}

function activeFilters(searchParams: Record<string, string | string[] | undefined>) {
  return Object.entries(searchParams).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const [{ items: properties, total }, localities] = await Promise.all([fetchProperties(resolvedSearchParams), fetchLocalities()]);
  const filters = activeFilters(resolvedSearchParams);
  const sort = (resolvedSearchParams.sort as string) || '';
  const verified = (resolvedSearchParams.verified as string) || '';

  return (
    <div className="container py-12 grid gap-8 md:grid-cols-[300px_1fr]">
      <aside className="bg-white rounded-2xl border border-slate-100 p-5 h-fit sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Filters</p>
          <Link href="/properties" className="text-sm text-slate-500">Reset</Link>
        </div>
        <form method="GET" className="space-y-4 text-sm text-slate-700">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Keyword</label>
            <input name="q" defaultValue={(resolvedSearchParams.q as string) || ''} className="w-full border rounded-lg px-3 py-2" placeholder="Project, area, landmark" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Location</label>
            <input name="location" defaultValue={(resolvedSearchParams.location as string) || ''} className="w-full border rounded-lg px-3 py-2" placeholder="City or micromarket" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500">Min price</label>
              <input name="minPrice" defaultValue={(resolvedSearchParams.minPrice as string) || ''} className="w-full border rounded-lg px-3 py-2" placeholder="5000000" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500">Max price</label>
              <input name="maxPrice" defaultValue={(resolvedSearchParams.maxPrice as string) || ''} className="w-full border rounded-lg px-3 py-2" placeholder="30000000" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Type</label>
            <select name="type" defaultValue={(resolvedSearchParams.type as string) || ''} className="w-full border rounded-lg px-3 py-2">
              <option value="">All</option>
              <option value="APARTMENT">Apartment</option>
              <option value="VILLA">Villa</option>
              <option value="HOUSE">House</option>
              <option value="STUDIO">Studio</option>
              <option value="PLOT">Plot</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Status</label>
            <select name="status" defaultValue={(resolvedSearchParams.status as string) || ''} className="w-full border rounded-lg px-3 py-2">
              <option value="">Any</option>
              <option value="AVAILABLE">Available</option>
              <option value="PENDING">Pending</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Trust</label>
            <select name="verified" defaultValue={verified} className="w-full border rounded-lg px-3 py-2">
              <option value="">Any listing</option>
              <option value="true">Verified only</option>
              <option value="false">Review-needed only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Beds</label>
            <select name="bedrooms" defaultValue={(resolvedSearchParams.bedrooms as string) || ''} className="w-full border rounded-lg px-3 py-2">
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500">Sort</label>
            <select name="sort" defaultValue={sort} className="w-full border rounded-lg px-3 py-2">
              <option value="">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="quality_desc">Highest quality</option>
              <option value="recommended">Smart ranking</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-brand text-white py-2 rounded-lg font-semibold">Apply filters</button>
        </form>
        {localities.length > 0 && (
          <div className="mt-6 pt-6 border-t space-y-3">
            <p className="font-semibold">Top localities</p>
            <div className="space-y-2">
              {localities.slice(0, 3).map((item) => (
                <Link key={item.slug} href={`/localities/${item.slug}`} className="block rounded-xl border border-slate-100 p-3 hover:border-brand">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.livabilityScore}/100 livability • {item.listingCount} listings</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Properties</h1>
            <p className="text-sm text-slate-500">{total} result{total === 1 ? '' : 's'} matching your current search.</p>
          </div>
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map(([key, value]) => (
                <span key={key} className="px-3 py-1 rounded-full bg-brand-soft text-brand text-xs">
                  {key}: {Array.isArray(value) ? value.join(', ') : value}
                </span>
              ))}
            </div>
          )}
        </div>

        {properties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <div key={property.id} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-3">
            <p className="text-lg font-semibold">No properties match these filters.</p>
            <p className="text-sm text-slate-500">Try broadening your location, price range, or property type.</p>
            <Link href="/properties" className="inline-flex px-4 py-2 rounded-lg border font-medium">
              Clear all filters
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

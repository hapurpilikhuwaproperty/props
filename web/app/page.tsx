import Hero from '../components/Hero';
import FeaturedGrid from '../components/FeaturedGrid';
import TrendingGrid from '../components/TrendingGrid';
import Categories from '../components/Categories';
import CtaBand from '../components/CtaBand';
import LogosStrip from '../components/LogosStrip';
import StatsIcons from '../components/StatsIcons';
import Testimonials from '../components/Testimonials';
import AboutBlock from '../components/AboutBlock';
import BlogStrip from '../components/BlogStrip';
import TrustBar from '../components/TrustBar';
import HowWeWork from '../components/HowWeWork';
import { LocalitySummary, Property } from '../types';
import LocalitySpotlight from '../components/LocalitySpotlight';
import { getServerJson } from '../lib/server-api';

async function fetchFeatured(): Promise<Property[]> {
  try {
    const data = await getServerJson<{ items: Property[] }>('/properties', { params: { pageSize: 6 }, revalidate: 300 });
    return data.items;
  } catch {
    return [];
  }
}

async function fetchLocalities(): Promise<LocalitySummary[]> {
  try {
    return await getServerJson<LocalitySummary[]>('/intelligence/localities', { revalidate: 300 });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, localities] = await Promise.all([fetchFeatured(), fetchLocalities()]);
  return (
    <div>
      <Hero />
      <TrustBar />
      <LogosStrip />
      <FeaturedGrid properties={featured} />
      <TrendingGrid properties={featured} />
      <LocalitySpotlight items={localities} />
      <Categories />
      <StatsIcons />
      <CtaBand />
      <Testimonials />
      <HowWeWork />
      <BlogStrip />
      <AboutBlock />
    </div>
  );
}

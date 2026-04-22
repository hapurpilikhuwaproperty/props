export type Property = {
  id: number;
  title: string;
  description: string;
  price: number | string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  type: string;
  bedrooms: number;
  bathrooms: number;
  status: string;
  verified?: boolean;
  verificationLevel?: string;
  listingSource?: string;
  qualityScore?: number;
  recommendationScore?: number;
  recommendationReason?: string;
  responseTimeHours?: number | null;
  lastVerifiedAt?: string | null;
  freshnessDays?: number | null;
  inquiryCount?: number;
  favoriteCount?: number;
  visitCount?: number;
  shortlistCount?: number;
  localityName?: string;
  localitySlug?: string;
  agentId?: number;
  images: { url: string; isCover: boolean }[];
  areaSqFt?: number | string | null;
  amenities?: { amenity: { id: number; name: string } }[];
  agent?: {
    id?: number;
    name: string;
    email: string;
    phone?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type AgentScorecard = {
  agent: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
  };
  stats: {
    propertyCount: number;
    verifiedListings: number;
    inquiryCount: number;
    touchedInquiries: number;
    visitCount: number;
    completedVisits: number;
    conversionRate: number;
    averageQuality: number;
    averageResponseHours: number | null;
    averageVisitRating: number | null;
    responsivenessScore: number;
    shortlistMomentum: number;
  };
  badges: string[];
};

export type LocalitySummary = {
  slug: string;
  name: string;
  headline: string;
  livabilityScore: number;
  rentalDemandScore: number;
  averagePrice: number;
  averageQuality: number;
  listingCount: number;
  availableCount: number;
  inquiryVelocity: number;
  collaborationSignals: number;
  visitMomentum: number;
  priceMomentum: string;
};

export type LocalityInsight = {
  slug: string;
  name: string;
  headline: string;
  commuteSummary: string;
  marketPulse: string;
  priceMomentum: string;
  yieldOutlook: string;
  walkability: string;
  livabilityScore: number;
  rentalDemandScore: number;
  infraSignals: string[];
  watchouts: string[];
  schools: string[];
  hospitals: string[];
  transit: string[];
  buyerTypes: string[];
  stats: {
    listingCount: number;
    availableCount: number;
    averagePrice: number;
    averageQuality: number;
    averagePricePerSqFt: number;
    inquiryVelocity: number;
    collaborationSignals: number;
    visitMomentum: number;
    verificationRate: number;
    averageResponseHours: number | null;
  };
  topAgents: Array<{
    id: number;
    name: string;
    listingCount: number;
    averageQuality: number;
  }>;
  properties: Property[];
};

export type Visit = {
  id: number;
  scheduledAt: string;
  status: string;
  notes?: string | null;
  rating?: number | null;
  createdAt?: string;
  updatedAt?: string;
  property: {
    id: number;
    title: string;
    location: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  agent?: {
    id: number;
    name: string;
    email: string;
  };
};

export type Shortlist = {
  id: number;
  name: string;
  shareToken: string;
  owner: {
    id: number;
    name: string;
    email?: string | null;
  };
  isOwner: boolean;
  canEdit: boolean;
  collaborators: Array<{
    id: number;
    name: string;
    email?: string | null;
    canEdit: boolean;
    joinedAt: string;
  }>;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    note?: string | null;
    priority: number;
    createdAt: string;
    property: Property;
    votes: Array<{
      id: number;
      value: number;
      createdAt: string;
      user: {
        id: number;
        name: string;
        email?: string | null;
      };
    }>;
    voteAverage: number | null;
    myVote: number | null;
    comments: Array<{
      id: number;
      body: string;
      createdAt: string;
      author: {
        id: number;
        name: string;
        email?: string | null;
      };
    }>;
  }>;
};

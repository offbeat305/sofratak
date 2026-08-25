export type PlacePrediction = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  /** for the directory-powered competition row */
  lat: number | null;
  lng: number | null;
  /** first Google photo resource — rendered live via /api/eat/photo */
  photoName: string | null;
  formattedAddress: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  userRatingCount: number | null;
  openingHoursText: string[] | null;
  businessStatus: string | null;
};

export type WebsiteScan = {
  checked: boolean;
  https: boolean;
  mobileFriendly: boolean;
  orderingPlatform: string | null;
  marketplaceLinks: string[];
  fetchError: boolean;
};

export type PageSpeedScan = {
  checked: boolean;
  performanceScore: number | null;
};

export type GraderSignals = {
  place: PlaceDetails;
  website: WebsiteScan;
  pageSpeed: PageSpeedScan;
};

export type GraderCategoryScore = {
  key: "googleProfile" | "reviews" | "website" | "onlineOrdering";
  score: number;
  findings: string[];
};

export type GraderScore = {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: GraderCategoryScore[];
  estimatedMonthlyImpactLowCents: number;
  estimatedMonthlyImpactHighCents: number;
};

export type GraderCompetition = {
  /** published directory listings within ~3 miles */
  count: number;
  /** up to 3 nearby names (client blurs them — FOMO, not a directory leak) */
  names: string[];
};

export type GraderResult = {
  placeId: string;
  restaurantName: string;
  signals: GraderSignals;
  score: GraderScore;
  competition: GraderCompetition | null;
};

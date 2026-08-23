export type PlacePrediction = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
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

export type GraderResult = {
  placeId: string;
  restaurantName: string;
  signals: GraderSignals;
  score: GraderScore;
};

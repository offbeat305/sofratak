import type { GraderCategoryScore, GraderScore, GraderSignals } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function scoreGoogleProfile(signals: GraderSignals): GraderCategoryScore {
  const { place } = signals;
  const findings: string[] = [];
  let score = 0;
  if (place.website) score += 34;
  else findings.push("no_website_on_profile");
  if (place.phone) score += 33;
  else findings.push("no_phone_on_profile");
  if (place.openingHoursText && place.openingHoursText.length > 0) score += 33;
  else findings.push("no_hours_on_profile");
  return { key: "googleProfile", score: clamp(score), findings };
}

function scoreReviews(signals: GraderSignals): GraderCategoryScore {
  const { rating, userRatingCount } = signals.place;
  const findings: string[] = [];
  if (rating === null || userRatingCount === null || userRatingCount === 0) {
    return { key: "reviews", score: 5, findings: ["no_reviews"] };
  }
  const ratingScore = (rating / 5) * 70;
  const volumeScore = Math.min(userRatingCount, 100) / 100 * 30;
  if (rating < 4.0) findings.push("low_rating");
  if (userRatingCount < 20) findings.push("low_review_count");
  return { key: "reviews", score: clamp(Math.round(ratingScore + volumeScore)), findings };
}

function scoreWebsite(signals: GraderSignals): GraderCategoryScore {
  const { place, website, pageSpeed } = signals;
  const findings: string[] = [];
  if (!place.website) return { key: "website", score: 0, findings: ["no_website"] };
  if (website.fetchError) return { key: "website", score: 40, findings: ["website_unreachable"] };

  let score = 0;
  if (website.https) score += 25;
  else findings.push("no_https");
  if (website.mobileFriendly) score += 25;
  else findings.push("not_mobile_friendly");

  if (pageSpeed.checked && pageSpeed.performanceScore !== null) {
    score += Math.round((pageSpeed.performanceScore / 100) * 50);
    if (pageSpeed.performanceScore < 50) findings.push("slow_site");
  } else {
    score += 25; // couldn't check — don't penalize for it, don't fully credit either
  }

  return { key: "website", score: clamp(score), findings };
}

function scoreOnlineOrdering(signals: GraderSignals): GraderCategoryScore {
  const { website } = signals;
  if (!website.checked || website.fetchError) {
    return { key: "onlineOrdering", score: 40, findings: ["ordering_unknown"] };
  }
  if (website.orderingPlatform === "sofratak") {
    return { key: "onlineOrdering", score: 100, findings: ["already_on_sofratak"] };
  }
  if (website.orderingPlatform) {
    return { key: "onlineOrdering", score: 60, findings: ["has_paid_ordering_platform"] };
  }
  if (website.marketplaceLinks.length > 0) {
    return { key: "onlineOrdering", score: 30, findings: ["marketplace_dependent"] };
  }
  return { key: "onlineOrdering", score: 10, findings: ["no_ordering_detected"] };
}

const GRADE_THRESHOLDS: Array<[number, GraderScore["grade"]]> = [
  [90, "A"],
  [75, "B"],
  [60, "C"],
  [40, "D"],
];

function gradeFor(overall: number): GraderScore["grade"] {
  for (const [min, grade] of GRADE_THRESHOLDS) {
    if (overall >= min) return grade;
  }
  return "F";
}

/**
 * Illustrative, not measured — the report UI shows the assumptions
 * plainly (order-volume band, commission rate) rather than presenting
 * this as a fact about the specific restaurant. Keeps the number honest
 * and, per Zizo, more credible to an owner who'd see through a vague
 * scary figure with no math behind it.
 */
const ASSUMED_AVG_TICKET_CENTS = 2500;
const MARKETPLACE_ORDERS_LOW = 150;
const MARKETPLACE_ORDERS_HIGH = 400;
const MARKETPLACE_COMMISSION_LOW = 0.15;
const MARKETPLACE_COMMISSION_HIGH = 0.3;
const PLATFORM_FEE_DELTA_LOW_CENTS = 30; // vs Sofratak's flat $0.79/order, $0 commission
const PLATFORM_FEE_DELTA_HIGH_CENTS = 150;
const PLATFORM_ORDERS_LOW = 150;
const PLATFORM_ORDERS_HIGH = 400;

function estimateImpact(orderingCategory: GraderCategoryScore): {
  low: number;
  high: number;
} {
  if (orderingCategory.findings.includes("already_on_sofratak")) return { low: 0, high: 0 };

  if (
    orderingCategory.findings.includes("marketplace_dependent") ||
    orderingCategory.findings.includes("no_ordering_detected")
  ) {
    return {
      low: Math.round(MARKETPLACE_ORDERS_LOW * ASSUMED_AVG_TICKET_CENTS * MARKETPLACE_COMMISSION_LOW),
      high: Math.round(MARKETPLACE_ORDERS_HIGH * ASSUMED_AVG_TICKET_CENTS * MARKETPLACE_COMMISSION_HIGH),
    };
  }

  if (orderingCategory.findings.includes("has_paid_ordering_platform")) {
    return {
      low: PLATFORM_ORDERS_LOW * PLATFORM_FEE_DELTA_LOW_CENTS,
      high: PLATFORM_ORDERS_HIGH * PLATFORM_FEE_DELTA_HIGH_CENTS,
    };
  }

  return { low: 0, high: 0 };
}

export function scoreGrade(signals: GraderSignals): GraderScore {
  const categories = [
    scoreGoogleProfile(signals),
    scoreReviews(signals),
    scoreWebsite(signals),
    scoreOnlineOrdering(signals),
  ];
  const overall = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  const ordering = categories.find((c) => c.key === "onlineOrdering")!;
  const impact = estimateImpact(ordering);

  return {
    overall: clamp(overall),
    grade: gradeFor(overall),
    categories,
    estimatedMonthlyImpactLowCents: impact.low,
    estimatedMonthlyImpactHighCents: impact.high,
  };
}

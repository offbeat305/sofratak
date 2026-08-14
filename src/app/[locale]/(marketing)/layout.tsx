import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Assistant } from "@/components/marketing/assistant";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { CITIES } from "@/content/cities";
import { SITE_URL } from "@/lib/seo";

/**
 * Sitewide Organization + WebSite JSON-LD (GEO/SEO): every marketing page
 * carries this so search engines AND AI answer engines (ChatGPT search,
 * Perplexity, Google AI Overviews) have one unambiguous entity to cite —
 * name, what we do, service area, contact. City-specific LocalBusiness/
 * Service/FAQ schema still lives on each city page on top of this.
 */
function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Sofratak",
    alternateName: "سفرتك",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-full.png`,
    description:
      "Sofratak is commission-free online ordering software for independent restaurants, built for Arab, Middle Eastern, Mediterranean, and halal kitchens across the United States. Restaurants keep 100% of food revenue; diners pay a flat 79-cent service fee per order.",
    slogan: "Take Control. Own Your Growth.",
    foundingLocation: { "@type": "Place", name: "Tampa, Florida" },
    areaServed: CITIES.map((c) => ({ "@type": "City", name: `${c.name.en}, ${c.state}` })),
    sameAs: [
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER &&
        `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}`,
    ].filter(Boolean),
  };
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppLink variant="floating" />
      <StickyCta whatsappNumber={whatsappNumber} />
      <Assistant whatsappNumber={whatsappNumber} />
    </>
  );
}

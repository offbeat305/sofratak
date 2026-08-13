import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { StickyCta } from "@/components/marketing/sticky-cta";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? null;
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppLink variant="floating" />
      <StickyCta whatsappNumber={whatsappNumber} />
    </>
  );
}

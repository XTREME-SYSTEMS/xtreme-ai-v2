import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import AITools from "@/components/marketing/AITools";
import Methodology from "@/components/marketing/Methodology";
import Services from "@/components/marketing/Services";
import PricingSection from "@/components/marketing/PricingSection";
import FAQ from "@/components/marketing/FAQ";
import Industries from "@/components/marketing/Industries";
import About from "@/components/marketing/About";
import PWAInstallBar from "@/components/marketing/PWAInstallBar";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function Marketing() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <AITools />
        <Methodology />
        <Services />
        <PricingSection />
        <FAQ />
        <Industries />
        <About />
      </main>
      <MarketingFooter />
      <PWAInstallBar />
    </div>
  );
}
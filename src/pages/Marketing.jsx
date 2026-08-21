import MarketingNav from "@/components/marketing/MarketingNav";
import HeroInteractive from "@/components/marketing/HeroInteractive";
import AwardBadges from "@/components/marketing/AwardBadges";
import AllInOneTabs from "@/components/marketing/AllInOneTabs";
import Pillars from "@/components/marketing/Pillars";
import Testimonial from "@/components/marketing/Testimonial";
import Community from "@/components/marketing/Community";
import PricingSection from "@/components/marketing/PricingSection";
import FAQ from "@/components/marketing/FAQ";
import PWAInstallBar from "@/components/marketing/PWAInstallBar";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function Marketing() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <HeroInteractive />
        <AwardBadges />
        <AllInOneTabs />
        <Pillars />
        <Testimonial />
        <Community />
        <PricingSection />
        <FAQ />
      </main>
      <MarketingFooter />
      <PWAInstallBar />
    </div>
  );
}
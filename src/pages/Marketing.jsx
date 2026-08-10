import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import AITools from "@/components/marketing/AITools";
import Services from "@/components/marketing/Services";
import Methodology from "@/components/marketing/Methodology";
import Industries from "@/components/marketing/Industries";
import PricingSection from "@/components/marketing/PricingSection";
import About from "@/components/marketing/About";
import Process from "@/components/marketing/Process";
import FAQ from "@/components/marketing/FAQ";
import Contact from "@/components/marketing/Contact";
import Partners from "@/components/marketing/Partners";
import PWAInstallBar from "@/components/marketing/PWAInstallBar";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function Marketing() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <AITools />
        <Services />
        <Methodology />
        <Industries />
        <Partners />
        <PricingSection />
        <Process />
        <About />
        <FAQ />
        <Contact />
      </main>
      <div className="h-16" />
      <MarketingFooter />
      <PWAInstallBar />
    </div>
  );
}
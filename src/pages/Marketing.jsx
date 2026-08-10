import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import AITools from "@/components/marketing/AITools";
import Services from "@/components/marketing/Services";
import PricingSection from "@/components/marketing/PricingSection";
import About from "@/components/marketing/About";
import Process from "@/components/marketing/Process";
import Contact from "@/components/marketing/Contact";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function Marketing() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <AITools />
        <Services />
        <PricingSection />
        <Process />
        <About />
        <Contact />
      </main>
      <MarketingFooter />
    </div>
  );
}
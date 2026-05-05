import Hero from "@/components/LandingPage/HeroSection";
import Features from "@/components/LandingPage/FeaturesSection";
import Trust from "@/components/LandingPage/TrustSection";
import CTA from "@/components/LandingPage/CTA";

export default function Home() {
  return (
    <main className="pt-20 bg-[#0b1326] text-[#dae2fd] font-body selection:bg-[#adc6ff]/30">
      {/* Hero Section */}
      <section id="hero">
        <Hero />
      </section>

      {/* Features Section */}
      <section id="features">
        <Features />
      </section>

      {/* Trust Section */}
      <section id="trust">
        <Trust />
      </section>

      {/* Final CTA */}
      <CTA />
    </main>
  );
}

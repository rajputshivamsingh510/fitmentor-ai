import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { ProgramsSection } from "@/components/home/ProgramsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { ParticleBackground } from "@/components/animations/ParticleBackground";

// Interactive Coaching Section (Muscle Map & AI Tool)
import { InteractiveCoachingSection } from "@/components/home/InteractiveCoachingSection";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden">
      <ParticleBackground />
      <Navbar />
      
      <HeroSection />
      <FeaturesSection />
      
      {/* Container for Muscle Map and AI interactive elements */}
      <InteractiveCoachingSection />
      
      <ProgramsSection />
      <TestimonialsSection />
      <PricingSection />
      
      <Footer />
    </main>
  );
}

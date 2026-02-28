'use client';

import React from 'react';
import HeroSection from './landing/HeroSection';
import ProblemSolutionSection from './landing/ProblemSolutionSection';
import HowItWorksSection from './landing/HowItWorksSection';
import CoreServicesSection from './landing/CoreServicesSection';
import DeepFeatureSections from './landing/DeepFeatureSections';
import FeatureGridSection from './landing/FeatureGridSection';
import UseCasesSection from './landing/UseCasesSection';
import SocialProofSection from './landing/SocialProofSection';
import ComparisonSection from './landing/ComparisonSection';
import PricingPreviewSection from './landing/PricingPreviewSection';
import FAQSection from './landing/FAQSection';
import FinalCTASection from './landing/FinalCTASection';
import MobileStickyCTA from './landing/MobileStickyCTA';

const LandingPage: React.FC = () => {
  return (
    <div className="dark min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
      {/* Global Background Textures */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] mask-image-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Main Content Flow */}
      <div className="relative z-10">
        <HeroSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <CoreServicesSection />
        <DeepFeatureSections />
        <FeatureGridSection />
        <UseCasesSection />
        <SocialProofSection />
        <ComparisonSection />
        <PricingPreviewSection />
        <FAQSection />
        <FinalCTASection />
      </div>

      {/* Mobile Sticky CTA */}
      <MobileStickyCTA />
    </div>
  );
};

export default LandingPage;

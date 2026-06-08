import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import RevenueCalculator from './sections/RevenueCalculator';
import WhatOutroundIs from './sections/WhatOutroundIs';
import HowOutroundWorks from './sections/HowOutroundWorks';
import OrbSection from './sections/OrbSection';
import MoatSection from './sections/MoatSection';
import FinalCTA from './sections/FinalCTA';

export default function HomePage() {
  return (
    <main>
      <section style={{ position: 'relative' }}>
        <HeroDotGrid />
        <Hero />
      </section>
      <RevenueCalculator />
      <WhatOutroundIs />
      <HowOutroundWorks />
      <OrbSection />
      <MoatSection />
      <FinalCTA />
    </main>
  );
}

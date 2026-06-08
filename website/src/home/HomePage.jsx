import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import WhatOutroundIs from './sections/WhatOutroundIs';
import HowOutroundWorks from './sections/HowOutroundWorks';
import RevenueCalculator from './sections/RevenueCalculator';
import OrbSection from './sections/OrbSection';
import MoatSection from './sections/MoatSection';
import FinalCTA from './sections/FinalCTA';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60 }}>
        <section style={{ position: 'relative' }}>
          <HeroDotGrid />
          <Hero />
        </section>
        <WhatOutroundIs />
        <HowOutroundWorks />
        <RevenueCalculator />
        <OrbSection />
        <MoatSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

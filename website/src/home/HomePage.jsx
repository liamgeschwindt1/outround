import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import RevenueCalculator from './sections/RevenueCalculator';
import SolutionSection from './sections/SolutionSection';
import HowOutroundWorks from './sections/HowOutroundWorks';
import DataPrivacy from './sections/DataPrivacy';
import OrbSection from './sections/OrbSection';
import FinalCTA from './sections/FinalCTA';

export default function HomePage() {
  return (
    <main>
      <section style={{ position: 'relative' }}>
        <HeroDotGrid />
        <Hero />
      </section>
      <RevenueCalculator />
      <SolutionSection />
      <HowOutroundWorks />
      <DataPrivacy />
      <OrbSection />
      <FinalCTA />
    </main>
  );
}

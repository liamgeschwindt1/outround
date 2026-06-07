import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import RevenueCalculator from './sections/RevenueCalculator';
import DayBar from './sections/DayBar';
import SolutionSection from './sections/SolutionSection';
import HowOutroundWorks from './sections/HowOutroundWorks';
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
      <DayBar />
      <SolutionSection />
      <HowOutroundWorks />
      <OrbSection />
      <FinalCTA />
    </main>
  );
}

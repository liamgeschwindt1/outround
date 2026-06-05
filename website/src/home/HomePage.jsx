import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import RevenueCalculator from './sections/RevenueCalculator';
import HowOutroundWorks from './sections/HowOutroundWorks';
import OrbSection from './sections/OrbSection';
import ManagerDashboard from './sections/ManagerDashboard';
import FinalCTA from './sections/FinalCTA';

export default function HomePage() {
  return (
    <main>
      <section style={{ position: 'relative' }}>
        <HeroDotGrid />
        <Hero />
      </section>
      <RevenueCalculator />
      <HowOutroundWorks />
      <OrbSection />
      <ManagerDashboard />
      <FinalCTA />
    </main>
  );
}

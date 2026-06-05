import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import RevenueCalculator from './sections/RevenueCalculator';
import WhatYouNeverSaw from './sections/WhatYouNeverSaw';
import HowItWorks from './sections/HowItWorks';
import IntegrationWorkflow from './sections/IntegrationWorkflow';
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
      <WhatYouNeverSaw />
      <HowItWorks />
      <IntegrationWorkflow />
      <OrbSection />
      <ManagerDashboard />
      <FinalCTA />
    </main>
  );
}

import { useRef } from 'react';
import HeroDotGrid from './HeroDotGrid';
import Hero from './sections/Hero';
import HowItWorks from './sections/HowItWorks';
import DemoSection from './sections/DemoSection';

export default function HomePage() {
  const demoRef = useRef(null);

  return (
    <main>
      {/* Hero */}
      <section style={{ position: 'relative' }}>
        <HeroDotGrid />
        <Hero demoRef={demoRef} />
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Interactive demo */}
      <DemoSection sectionRef={demoRef} />
    </main>
  );
}

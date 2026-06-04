import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SlackCard from '../components/SlackCard';

const SECTIONS = [
  {
    label: 'Person',
    lines: [
      'Jana Novak · VP Procurement · Mollie',
      '8 years at Mollie. Data-driven decision maker.',
      'Referenced supply chain background twice in prior calls.',
    ],
  },
  {
    label: 'Company signal',
    lines: [
      'Posted 2 enterprise software RFPs this week.',
      'Actively evaluating vendors. Budget confirmed Q2.',
    ],
  },
  {
    label: 'Last interaction — April 14',
    lines: [
      'Disengaged at min 22 when implementation timeline raised.',
      'Concern not fully resolved. She wanted specific dates.',
    ],
  },
  {
    label: "Today's recommendation",
    lines: [
      'Lead with deployment timeline before features.',
      'She responds to specifics not capabilities.',
      'Reference: Adyen deployment (6 weeks). Use that case.',
    ],
  },
];

function useTypewriter(text, active, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    let i = 0;
    setDisplayed('');
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return displayed;
}

function TypedLine({ text, active }) {
  const displayed = useTypewriter(text, active);
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, minHeight: '1.6em' }}>
      {displayed}
      {active && displayed.length < text.length && (
        <span style={{ borderRight: '1px solid var(--coral)', marginLeft: 1 }}>&nbsp;</span>
      )}
    </div>
  );
}

export default function Scene2_PreMeetingBrief({ isActive, sound }) {
  const [revealedSections, setRevealedSections] = useState(0);
  const [revealedLines, setRevealedLines] = useState({});

  useEffect(() => {
    if (!isActive) return;
    let sectionIdx = 0;

    function revealNextSection() {
      if (sectionIdx >= SECTIONS.length) {
        sound.stopTyping();
        return;
      }
      setRevealedSections(sectionIdx + 1);
      const section = SECTIONS[sectionIdx];
      let lineIdx = 0;

      function revealNextLine() {
        if (lineIdx >= section.lines.length) {
          sectionIdx++;
          setTimeout(revealNextSection, 80);
          return;
        }
        const lineKey = `${sectionIdx}-${lineIdx}`;
        setRevealedLines(prev => ({ ...prev, [lineKey]: true }));
        sound.play('typing');
        const charTime = section.lines[lineIdx].length * 28 + 100;
        lineIdx++;
        setTimeout(revealNextLine, charTime);
      }
      revealNextLine();
    }

    const t = setTimeout(revealNextSection, 200);
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', height: '100%', padding: '24px', overflowY: 'auto' }}
      onClick={e => e.stopPropagation()}
    >
      <SlackCard timestamp="2 minutes ago" style={{ maxWidth: 460 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
          You&rsquo;re meeting Jana Novak in 12 minutes.
        </div>

        {SECTIONS.map((sec, si) => (
          si < revealedSections ? (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                borderLeft: '2px solid var(--coral)',
                paddingLeft: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 6,
                }}
              >
                {sec.label}
              </div>
              {sec.lines.map((line, li) => {
                const key = `${si}-${li}`;
                return revealedLines[key] ? (
                  <TypedLine key={key} text={line} active={true} />
                ) : null;
              })}
            </motion.div>
          ) : null
        ))}
      </SlackCard>
    </div>
  );
}

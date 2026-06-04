import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FIELDS = [
  { label: 'Objection type',      value: 'Implementation timeline',    source: '22:14' },
  { label: 'Competitor mentioned', value: 'Salesforce',                source: '31:08' },
  { label: 'Decision timeline',   value: 'September 2026',             source: '44:02' },
  { label: 'Deal risk',           value: 'Medium',                     source: 'composite' },
  { label: 'Next steps',          value: 'Send deployment case study by Friday', source: '51:33' },
];

function useTypewriter(text, active, speed = 30) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!active) { setDisplayed(''); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active]);
  return displayed;
}

function CRMField({ label, value, source, active }) {
  const displayed = useTypewriter(value, active);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr auto',
        gap: 12,
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '0.5px solid var(--border)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--text-primary)',
          fontWeight: 600,
          minHeight: '1.4em',
        }}
      >
        {displayed}
        {active && displayed.length < value.length && (
          <span style={{ borderRight: '1px solid var(--coral)' }}>&nbsp;</span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--coral)',
            opacity: showTooltip ? 1 : 0.7,
            border: '0.5px solid rgba(242,107,69,0.4)',
            borderRadius: 4,
            padding: '2px 6px',
            cursor: 'default',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
          }}
        >
          [{source}]
        </span>
        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: '100%',
              marginBottom: 6,
              background: 'var(--bg-hover)',
              border: '0.5px solid var(--border-md)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-sub)',
              whiteSpace: 'nowrap',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            View in transcript
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CRMPanel({ isActive, sound }) {
  const [visibleFields, setVisibleFields] = useState(0);
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    if (!isActive) { setVisibleFields(0); setShowSynced(false); return; }

    let i = 0;
    function next() {
      if (i >= FIELDS.length) {
        setTimeout(() => setShowSynced(true), 400);
        return;
      }
      setVisibleFields(i + 1);
      sound.play('click');
      const charTime = FIELDS[i].value.length * 30 + 200;
      i++;
      setTimeout(next, charTime);
    }
    const t = setTimeout(next, 300);
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 560,
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '0.5px solid var(--border-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Mollie
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-sub)' }}>
              Jana Novak · VP Procurement
            </div>
          </div>
          <AnimatePresence>
            {showSynced && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '0.5px solid rgba(34,197,94,0.4)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'var(--green)',
                  fontWeight: 600,
                }}
              >
                ✓ CRM synced
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
          Updated by Outround · Just now
        </div>
      </div>

      {/* Fields */}
      {FIELDS.map((f, i) => (
        i < visibleFields ? (
          <CRMField
            key={i}
            label={f.label}
            value={f.value}
            source={f.source}
            active={i === visibleFields - 1}
            sound={sound}
          />
        ) : null
      ))}
    </div>
  );
}

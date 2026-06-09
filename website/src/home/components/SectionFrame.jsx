import { motion } from 'framer-motion';

/**
 * SectionFrame — wraps a landing-page section with edge-anchored metadata.
 * Gives every section a "spec-doc" feel: a section code at top-left,
 * an index marker at top-right.
 */
export default function SectionFrame({
  code,
  label,
  children,
  maxWidth = 1200,
  id,
  background = 'var(--bg)',
  minHeight = 'auto',
  sectionRef,
  style,
  align = 'flex-start',
}) {
  return (
    <section
      id={id}
      ref={sectionRef}
      style={{
        position: 'relative',
        background,
        minHeight,
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {(code || label) && (
        <div
          style={{
            width: '100%',
            maxWidth,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(32px, 5vw, 56px)',
            gap: 24,
          }}
        >
          {code ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--coral)',
                  opacity: 0.8,
                }}
              />
              {code}
            </motion.div>
          ) : (
            <span />
          )}
          {label && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                opacity: 0.65,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </motion.div>
          )}
        </div>
      )}

      <div
        style={{
          width: '100%',
          maxWidth,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: align,
        }}
      >
        {children}
      </div>
    </section>
  );
}

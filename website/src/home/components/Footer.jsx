const FOOTER_LINKS = [
  { label: 'What it is', href: '#what' },
  { label: 'How it works', href: '#how' },
  { label: 'Why it compounds', href: '#moat' },
  { label: 'Get started', href: '#cta' },
];

function scrollTo(href) {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export default function Footer() {
  return (
    <footer
      style={{
        background: '#0a0a0b',
        borderTop: '0.5px solid var(--border)',
        padding: 'clamp(40px, 5vw, 64px) clamp(20px, 4vw, 56px) clamp(28px, 3vw, 40px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        {/* Top row */}
        <div
          className="footer-top"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--coral)',
                  display: 'inline-block',
                  boxShadow: '0 0 10px rgba(242,107,69,0.5)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Outround
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: 260,
                margin: 0,
              }}
            >
              The memory and coordination layer beneath every conversation your team has.
            </p>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}
            >
              EU hosted &middot; GDPR native
            </div>
          </div>

          {/* Nav links */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Product
            </div>
            {FOOTER_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-sub)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-sub)';
                }}
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div
          className="footer-bottom"
          style={{
            borderTop: '0.5px solid var(--border)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            &copy; 2026 Outround. All rights reserved.
          </span>
          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'center',
            }}
          >
            {['Privacy', 'Terms', 'Security'].map((label) => (
              <span
                key={label}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  cursor: 'default',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-top { flex-direction: column; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  );
}

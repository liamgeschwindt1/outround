import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'What it is', href: '#what' },
  { label: 'How it works', href: '#how' },
  { label: 'Why it compounds', href: '#moat' },
];

function NavLink({ label, href, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick(href);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        color: hover ? 'var(--text-primary)' : 'var(--text-sub)',
        textDecoration: 'none',
        transition: 'color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </a>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function scrollTo(href) {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          background: scrolled ? 'rgba(10,10,11,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '0.5px solid var(--border)' : '0.5px solid transparent',
          transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 clamp(20px, 4vw, 56px)',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--coral)',
                display: 'inline-block',
                boxShadow: '0 0 10px rgba(242,107,69,0.6)',
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
          </a>

          {/* Desktop nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} label={l.label} href={l.href} onClick={scrollTo} />
            ))}
          </div>

          {/* Desktop CTA */}
          <motion.button
            className="nav-cta"
            whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(242,107,69,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollTo('#cta')}
            style={{
              background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
              color: '#0a0a0b',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              padding: '9px 20px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Get early access
          </motion.button>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              padding: 4,
            }}
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: 60,
              left: 0,
              right: 0,
              zIndex: 899,
              background: 'rgba(10,10,11,0.97)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '0.5px solid var(--border)',
              padding: '24px clamp(20px, 4vw, 56px) 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: '14px 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 18,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  borderBottom: '0.5px solid var(--border)',
                }}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('#cta')}
              style={{
                marginTop: 20,
                background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
                color: '#0a0a0b',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 24px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Get early access
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .nav-links  { display: none !important; }
          .nav-cta    { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}

import DemoController from '../../demo/DemoController';

export default function DemoSection({ sectionRef }) {
  return (
    <section
      ref={sectionRef}
      id="demo"
      style={{
        background: 'var(--bg)',
        padding: '80px 24px 120px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Section label */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Live demo
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Click or press space to advance.
        </div>

        {/* Demo container */}
        <div
          style={{
            height: 'clamp(480px, 60vw, 600px)',
            background: 'var(--bg)',
            border: '0.5px solid var(--border-md)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          <DemoController />
        </div>
      </div>
    </section>
  );
}

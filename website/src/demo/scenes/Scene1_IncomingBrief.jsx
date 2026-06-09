import PropTypes from 'prop-types';
import SlackCard from '../components/SlackCard';

function Scene1_IncomingBrief({ onAdvance, sound }) {
  function handleMount() {
    sound.play('notification');
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 24,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SlackCard timestamp="2 minutes ago" onMount={handleMount}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text-primary)',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            You&rsquo;re meeting Jana Novak in 12 minutes.
          </div>
          <div style={{ color: 'var(--text-sub)', marginBottom: 12 }}>
            VP Procurement · Mollie · Amsterdam
          </div>
          <div style={{ marginBottom: 4 }}>
            Last time: raised implementation timeline at min 22.
          </div>
          <div style={{ marginBottom: 16 }}>Today: Lead with deployment speed.</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--coral)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              padding: 0,
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            View full brief →
          </button>
        </div>
      </SlackCard>
    </div>
  );
}

Scene1_IncomingBrief.propTypes = {
  onAdvance: PropTypes.func.isRequired,
  sound: PropTypes.object.isRequired,
};

export default Scene1_IncomingBrief;

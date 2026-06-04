import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

export default function AnswerCard({ question, answer, source }) {
  const displayed = useTypewriter(answer);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--bg-card)',
        borderLeft: '3px solid var(--coral)',
        borderRadius: 12,
        border: '0.5px solid var(--border-md)',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--coral)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
          opacity: 0.7,
        }}
      >
        {question}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          marginBottom: 10,
          minHeight: '4.2em',
        }}
      >
        {displayed}
        {displayed.length < answer.length && (
          <span style={{ borderRight: '1px solid var(--coral)' }}>&nbsp;</span>
        )}
      </div>
      {displayed === answer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          {source}
        </motion.div>
      )}
    </motion.div>
  );
}

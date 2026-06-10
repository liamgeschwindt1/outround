import { useState, useEffect, useRef } from 'react';
import { T, R } from '../design/tokens';
import { api } from '../api/client';

// Intelligence page — orb UI for querying Outround's memory layer
// (The orb visual matches the website demo; backend Q&A is a stub for now)

function Orb({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer pulse rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: -(i * 20),
            borderRadius: '50%',
            border: `1px solid rgba(240,90,50,${String(0.12 - i * 0.03)})`,
            animation: active
              ? `orbPulse ${String(1.2 + i * 0.3)}s ease-in-out infinite ${String(i * 0.2)}s`
              : 'none',
          }}
        />
      ))}
      {/* Core */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle at 38% 38%, #f05a32 0%, #3d9fd4 60%, #0f0f11 100%)'
            : 'radial-gradient(circle at 38% 38%, rgba(240,90,50,0.4) 0%, rgba(61,159,212,0.3) 60%, #0f0f11 100%)',
          boxShadow: active
            ? '0 0 40px rgba(240,90,50,0.5), 0 0 80px rgba(61,159,212,0.2)'
            : '0 0 20px rgba(240,90,50,0.15)',
          transition: 'all 400ms ease',
        }}
      />
    </div>
  );
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function IntelligencePage() {
  const [active, setActive] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput('');
    setActive(true);
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setThinking(true);
    try {
      // Stub: returns a placeholder answer until the intelligence API is wired
      const res = await api
        .post<{ answer: string }>('/api/intel/ask', { question: q })
        .catch(() => null);
      const answer =
        res?.answer ??
        'Intelligence API not yet connected. When your meeting bot has processed calls, Outround will answer questions about your deals, contacts, and patterns here.';
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
      }}
    >
      <div
        style={{
          marginBottom: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: 0.8,
          color: T.t3,
        }}
      >
        INTELLIGENCE
      </div>
      <h1
        style={{
          fontFamily: T.display,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: -0.5,
          margin: '0 0 4px',
          color: T.t1,
        }}
      >
        Ask your memory
      </h1>
      <div style={{ fontSize: 13, color: T.t3, marginBottom: 24 }}>
        Query your deal history, contacts, and conversation patterns.
      </div>

      {/* Orb + messages area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 32,
            }}
          >
            <Orb
              active={active}
              onClick={() => {
                setActive((a) => !a);
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: T.t2, marginBottom: 8 }}>
                What do you want to know?
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'center',
                  maxWidth: 480,
                }}
              >
                {[
                  'Which deals are going cold?',
                  'What objections came up last week?',
                  'Who hasn&apos;t responded in 14 days?',
                  'Summarise my last call with Vandermeer',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: R.md,
                      background: T.bgElevate,
                      border: `1px solid ${T.borderMd}`,
                      color: T.t2,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius:
                      m.role === 'user'
                        ? `${String(R.xl)}px ${String(R.xl)}px 4px ${String(R.xl)}px`
                        : `${String(R.xl)}px ${String(R.xl)}px ${String(R.xl)}px 4px`,
                    background: m.role === 'user' ? 'rgba(240,90,50,0.12)' : T.bgCard,
                    border: `1px solid ${m.role === 'user' ? 'rgba(240,90,50,0.25)' : T.border}`,
                    fontSize: 13,
                    color: T.t1,
                    lineHeight: 1.6,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  padding: '10px 14px',
                  background: T.bgCard,
                  border: `1px solid ${T.border}`,
                  borderRadius: R.xl,
                  width: 'fit-content',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: T.coral,
                      animation: `bounce 1s ease-in-out ${String(i * 0.15)}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) void send();
          }}
          placeholder="Ask anything about your deals, contacts, or calls…"
          style={{
            flex: 1,
            height: 44,
            background: T.bgCard,
            border: `1px solid ${T.borderMd}`,
            borderRadius: R.md,
            padding: '0 14px',
            color: T.t1,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={() => {
            void send();
          }}
          disabled={!input.trim() || thinking}
          style={{
            height: 44,
            padding: '0 20px',
            background: input.trim() ? T.grad : T.bgElevate,
            border: `1px solid ${input.trim() ? 'transparent' : T.border}`,
            borderRadius: R.md,
            color: input.trim() ? '#fff' : T.t3,
            fontSize: 13,
            fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 150ms',
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.08);opacity:1} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}

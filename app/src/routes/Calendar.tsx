import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';
import type { UpcomingMeeting } from '../api/types';

// 24-hour day view — shows today's (and next 7 days') meetings on a time axis
// with click-through to meeting prep

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 7; // 07:00
const END_HOUR = 22; // 22:00
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

function fmt(h: number) {
  const label = h === 0 ? '12 AM' : h < 12 ? `${String(h)} AM` : h === 12 ? '12 PM' : `${String(h - 12)} PM`;
  return label;
}

function parseHour(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function MeetingBlock({ meeting, onClick }: { meeting: UpcomingMeeting; onClick: () => void }) {
  const startH = parseHour(meeting.starts_at);
  const endH = meeting.ends_at ? parseHour(meeting.ends_at) : startH + 1;
  const top = (startH - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max((endH - startH) * HOUR_HEIGHT, 28);
  const hasBot = !!meeting.bot;
  const botDone = meeting.bot?.status === 'done';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 2,
        right: 2,
        top,
        height,
        background: botDone
          ? 'rgba(22,163,74,0.15)'
          : hasBot
            ? 'rgba(61,159,212,0.15)'
            : 'rgba(240,90,50,0.12)',
        border: `1px solid ${botDone ? 'rgba(22,163,74,0.4)' : hasBot ? 'rgba(61,159,212,0.4)' : 'rgba(240,90,50,0.35)'}`,
        borderRadius: R.md,
        padding: '5px 8px',
        cursor: 'pointer',
        overflow: 'hidden',
        zIndex: 2,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.t1,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {meeting.title}
      </div>
      {height > 38 && (
        <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>
          {new Date(meeting.starts_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {meeting.prospect.name ? ` · ${meeting.prospect.name}` : ''}
        </div>
      )}
      {height > 52 && hasBot && (
        <div
          style={{
            fontSize: 10,
            fontFamily: T.mono,
            color: botDone ? T.green : T.sky,
            marginTop: 4,
          }}
        >
          {botDone ? '✓ transcript ready' : `bot ${meeting.bot?.status ?? 'joining'}`}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { data, loading } = useApi<{ connected: boolean; meetings: UpcomingMeeting[] }>(
    '/api/meetings/upcoming'
  );
  const meetings = (data?.meetings ?? []).filter((m) => {
    const d = new Date(m.starts_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === selectedDate.getTime();
  });

  // Build a week-strip for date selection
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  const nowHour = parseHour(new Date().toISOString());
  const isToday = selectedDate.getTime() === new Date(new Date().setHours(0, 0, 0, 0)).getTime();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 6,
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: 0.8,
          color: T.t3,
        }}
      >
        CALENDAR
      </div>
      <h1
        style={{
          fontFamily: T.display,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: -0.5,
          margin: '0 0 20px',
          color: T.t1,
        }}
      >
        {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </h1>

      {/* Day picker strip */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {weekDays.map((d) => {
          const active = d.getTime() === selectedDate.getTime();
          const hasMeetings = (data?.meetings ?? []).some((m) => {
            const md = new Date(m.starts_at);
            md.setHours(0, 0, 0, 0);
            return md.getTime() === d.getTime();
          });
          return (
            <button
              key={d.toISOString()}
              onClick={() => {
                setSelectedDate(d);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 12px',
                borderRadius: R.md,
                background: active ? T.grad : T.bgElevate,
                border: `1px solid ${active ? 'transparent' : T.border}`,
                cursor: 'pointer',
                minWidth: 52,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontFamily: T.mono,
                  color: active ? 'rgba(255,255,255,0.7)' : T.t3,
                  letterSpacing: 0.3,
                }}
              >
                {d.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: active ? '#fff' : T.t1 }}>
                {d.getDate()}
              </span>
              {hasMeetings && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: active ? 'rgba(255,255,255,0.7)' : T.coral,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.t3, fontSize: 13 }}>
          <div className="skel" style={{ width: 80, height: 4, borderRadius: 2 }} /> Loading
          meetings…
        </div>
      ) : !data?.connected ? (
        <div
          style={{
            padding: 24,
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: R.xl,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 14, color: T.t2, marginBottom: 12 }}>
            Google Calendar not connected.
          </div>
          <button
            onClick={() => {
              navigate('/settings');
            }}
            style={{
              padding: '8px 20px',
              background: T.grad,
              border: 'none',
              borderRadius: R.md,
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Connect in Settings →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 0 }}>
          {/* Time axis */}
          <div
            style={{
              width: 52,
              flexShrink: 0,
              position: 'relative',
              height: HOUR_HEIGHT * HOURS.length,
            }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: (h - START_HOUR) * HOUR_HEIGHT - 8,
                  right: 8,
                  fontSize: 10,
                  fontFamily: T.mono,
                  color: T.t4,
                  letterSpacing: 0.2,
                }}
              >
                {fmt(h)}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              height: HOUR_HEIGHT * HOURS.length,
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: R.xl,
              overflow: 'hidden',
            }}
          >
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: (h - START_HOUR) * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: T.border,
                }}
              />
            ))}

            {/* Current time indicator */}
            {isToday && nowHour >= START_HOUR && nowHour < END_HOUR && (
              <div
                style={{
                  position: 'absolute',
                  top: (nowHour - START_HOUR) * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: T.coral,
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: T.coral,
                    position: 'absolute',
                    left: -4,
                    top: -3,
                  }}
                />
              </div>
            )}

            {/* Meeting blocks */}
            {meetings.map((m) => (
              <MeetingBlock
                key={m.id}
                meeting={m}
                onClick={() => {
                  navigate(`/meeting/${m.id}`);
                }}
              />
            ))}

            {meetings.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%,-50%)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 13, color: T.t3 }}>No meetings scheduled.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

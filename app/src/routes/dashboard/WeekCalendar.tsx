import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R, scoreColor } from '../../design/tokens';
import { Button } from '../../design/primitives/Button';
import { EmptyState } from '../../design/primitives/Skeleton';
import type { MeetingsResponse, UpcomingMeeting } from '../../api/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(d: Date, offset = 0): Date {
  const day = new Date(d);
  const dow = day.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow; // Monday-start
  day.setDate(day.getDate() + diff + offset * 7);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: MeetingsResponse | null;
  loading: boolean;
  /** session history keyed by meeting.outround_session_id */
  sessionScores?: Record<string, number>;
}

// ─── Meeting card ─────────────────────────────────────────────────────────────

function MeetingCard({ m, isPast }: { m: UpcomingMeeting; isPast: boolean }) {
  const nav = useNavigate();
  const score = m.outround_session_id && (window as any).__sessionScores?.[m.outround_session_id];

  const handleGetReady = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (m.id) nav(`/meeting/${m.id}`);
    else nav('/round');
  };

  const handleAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (m.outround_session_id) nav(`/analysis/${m.outround_session_id}`);
  };

  return (
    <div
      style={{
        background: T.bgElevate,
        border: `1px solid ${T.border}`,
        borderRadius: R.md,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent stripe */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: isPast
            ? (m.outround_done ? T.coral : T.t4)
            : `linear-gradient(to bottom, ${T.coral}, ${T.sky})`,
          borderRadius: `${R.md}px 0 0 ${R.md}px`,
        }}
      />
      <div style={{ paddingLeft: 4 }}>
        {/* Title */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.t1,
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {m.prospect.name && m.prospect.name !== 'Unknown'
            ? m.prospect.name.split(' ')[0]
            : m.title}
        </div>

        {/* Time */}
        <div style={{ fontSize: 11, color: T.t3, marginTop: 2, fontFamily: T.mono }}>
          {fmtTime(m.starts_at)}
        </div>

        {/* Past: score badge or done indicator */}
        {isPast && m.outround_done && (
          <button
            onClick={handleAnalysis}
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: 'rgba(240,90,50,0.12)',
              border: '1px solid rgba(240,90,50,0.3)',
              borderRadius: R.pill,
              color: T.coral,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: T.numeric,
            }}
          >
            {score ? `${score}` : '✓'}
          </button>
        )}

        {/* Upcoming: get ready CTA */}
        {!isPast && (
          <div style={{ marginTop: 8 }}>
            <Button
              variant="outline-gradient"
              size="sm"
              onClick={handleGetReady}
              style={{ fontSize: 11, width: '100%' }}
            >
              Get ready →
            </Button>
          </div>
        )}

        {/* Past, not done: subtle dot */}
        {isPast && !m.outround_done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.t4 }} />
            <span style={{ fontSize: 10, color: T.t4 }}>No round</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Day column ───────────────────────────────────────────────────────────────

function DayColumn({
  date,
  meetings,
  isToday,
}: {
  date: Date;
  meetings: UpcomingMeeting[];
  isToday: boolean;
}) {
  const now = new Date();
  const dayLabel = DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dayNum = date.getDate();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Day header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          paddingBottom: 10,
          borderBottom: `1px solid ${isToday ? 'rgba(240,90,50,0.4)' : T.border}`,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: T.mono,
            letterSpacing: 0.8,
            color: isToday ? T.coral : T.t3,
          }}
        >
          {dayLabel}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: isToday ? T.coral : 'transparent',
            fontSize: 13,
            fontWeight: isToday ? 700 : 400,
            color: isToday ? '#fff' : T.t2,
            fontFamily: T.numeric,
          }}
        >
          {dayNum}
        </div>
      </div>

      {/* Meetings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {meetings.map((m) => (
          <MeetingCard
            key={m.id}
            m={m}
            isPast={new Date(m.starts_at) < now}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Week calendar ────────────────────────────────────────────────────────────

export function WeekCalendar({ data, loading }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const weekStart = startOfWeek(today, weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthLabel = weekStart.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // Group meetings by day
  const byDay = new Map<number, UpcomingMeeting[]>();
  days.forEach((d, i) => byDay.set(i, []));
  (data?.meetings ?? []).forEach((m) => {
    const mDate = new Date(m.starts_at);
    const idx = days.findIndex((d) => isSameDay(d, mDate));
    if (idx >= 0) byDay.get(idx)!.push(m);
  });

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18, color: T.t1 }}>
          {monthLabel}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            ‹
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            ›
          </Button>
        </div>
      </div>

      {/* Not connected */}
      {!loading && data && !data.connected && (
        <EmptyState
          title="Calendar not connected"
          body="Connect Google Calendar to see your schedule here."
          cta={
            <Button
              variant="outline-gradient"
              size="md"
              onClick={() => { window.location.href = '/auth/gcal'; }}
            >
              Connect Google Calendar
            </Button>
          }
        />
      )}

      {/* Week grid */}
      {(!data || data.connected) && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            minHeight: 260,
          }}
        >
          {days.map((date, i) => (
            <DayColumn
              key={i}
              date={date}
              meetings={byDay.get(i) ?? []}
              isToday={isSameDay(date, today)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

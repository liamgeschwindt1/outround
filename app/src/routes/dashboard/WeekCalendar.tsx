import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../../design/tokens';
import { Button } from '../../design/primitives/Button';
import { EmptyState } from '../../design/primitives/Skeleton';
import type { MeetingsResponse, UpcomingMeeting } from '../../api/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const START_HOUR = 8;
const END_HOUR   = 20;
const HOUR_PX    = 64;
const TOTAL_H    = (END_HOUR - START_HOUR) * HOUR_PX;
const GUTTER_W   = 48;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(d: Date, offset = 0): Date {
  const day = new Date(d);
  const dow = day.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + diff + offset * 7);
  day.setHours(0, 0, 0, 0);
  return day;
}

function fmtDuration(starts: string, ends: string): string {
  const mins = Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function topForTime(iso: string): number {
  const d = new Date(iso);
  const h = d.getHours() + d.getMinutes() / 60;
  return Math.max(0, (h - START_HOUR) * HOUR_PX);
}

function heightForMeeting(starts: string, ends: string): number {
  const mins = (new Date(ends).getTime() - new Date(starts).getTime()) / 60000;
  return Math.max(22, (mins / 60) * HOUR_PX);
}

function displayName(m: UpcomingMeeting): string {
  return m.prospect.name && m.prospect.name !== 'Unknown' ? m.prospect.name : m.title;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: MeetingsResponse | null;
  loading: boolean;
}

// ─── Meeting block (absolutely positioned on time grid) ───────────────────────

function MeetingBlock({
  m,
  isPast,
  selected,
  onClick,
}: {
  m: UpcomingMeeting;
  isPast: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const top    = topForTime(m.starts_at);
  const height = heightForMeeting(m.starts_at, m.ends_at);
  const accent = isPast ? T.coral : T.sky;
  const bg     = selected
    ? `rgba(${isPast ? '240,90,50' : '61,159,212'},0.18)`
    : `rgba(${isPast ? '240,90,50' : '61,159,212'},0.08)`;
  const label  = displayName(m).split(' ')[0];

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 3,
        right: 3,
        top,
        height,
        background: bg,
        border: `1px solid rgba(${isPast ? '240,90,50' : '61,159,212'},${selected ? '0.55' : '0.22'})`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: R.sm,
        padding: '3px 5px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'background 120ms, border-color 120ms',
        zIndex: selected ? 5 : 2,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.t1,
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
      {height >= 34 && (
        <div
          style={{
            fontSize: 10,
            color: T.t3,
            fontFamily: T.mono,
            marginTop: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {fmtTime(m.starts_at)}
          {isPast && m.outround_done && (
            <span style={{ color: T.coral, marginLeft: 4 }}>✓</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Side panel ───────────────────────────────────────────────────────────────

function SidePanel({ m, onClose }: { m: UpcomingMeeting; onClose: () => void }) {
  const nav    = useNavigate();
  const isPast = new Date(m.starts_at) < new Date();
  const label  = displayName(m);

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: T.bgCard,
        border: `1px solid ${T.borderMd}`,
        borderRadius: R.lg,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: T.t1,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 11, color: T.t3, fontFamily: T.mono, marginTop: 3 }}>
            {fmtTime(m.starts_at)} · {fmtDuration(m.starts_at, m.ends_at)}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: T.t3,
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ height: 1, background: T.border }} />

      {/* Past — round taken */}
      {isPast && m.outround_done && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 9,
                fontFamily: T.mono,
                letterSpacing: 0.7,
                color: T.t3,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Last round
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: T.coral,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              —
              <span style={{ fontSize: 12, color: T.t3, fontWeight: 400, marginLeft: 3 }}>
                /100
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => m.outround_session_id && nav(`/analysis/${m.outround_session_id}`)}
            >
              View report
            </Button>
            <Button variant="primary" size="sm" onClick={() => nav('/round')}>
              Go again
            </Button>
          </div>
        </div>
      )}

      {/* Past — no round */}
      {isPast && !m.outround_done && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: T.t3, lineHeight: 1.5 }}>
            No round before this meeting.
          </div>
          <Button variant="primary" size="sm" onClick={() => nav('/round')}>
            Run a round now
          </Button>
        </div>
      )}

      {/* Upcoming */}
      {!isPast && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: T.t3, lineHeight: 1.5 }}>
            {m.prospect.company
              ? `Prospect at ${m.prospect.company}.`
              : 'Upcoming meeting.'}
            {' '}Get a round in before it starts.
          </div>
          <Button
            variant="primary"
            size="md"
            style={{ width: '100%' }}
            onClick={() => (m.id ? nav(`/meeting/${m.id}`) : nav('/round'))}
          >
            Get ready →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeekCalendar({ data, loading }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected]     = useState<UpcomingMeeting | null>(null);

  const today     = new Date();
  const weekStart = startOfWeek(today, weekOffset);
  const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours     = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const monthLabel = weekStart.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const byDay = new Map<number, UpcomingMeeting[]>();
  days.forEach((_, i) => byDay.set(i, []));
  (data?.meetings ?? []).forEach((m) => {
    const idx = days.findIndex((d) => isSameDay(d, new Date(m.starts_at)));
    if (idx >= 0) byDay.get(idx)!.push(m);
  });

  const nowTop   = topForTime(today.toISOString());
  const todayIdx = days.findIndex((d) => isSameDay(d, today));

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Calendar ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Nav header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18, color: T.t1 }}>
            {monthLabel}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>‹</Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>›</Button>
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

        {/* Time grid */}
        {(!data || data.connected) && (
          <div style={{ display: 'flex' }}>

            {/* Time gutter */}
            <div style={{ width: GUTTER_W, flexShrink: 0, paddingTop: 40 }}>
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    height: HOUR_PX,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    paddingRight: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: T.t4,
                      fontFamily: T.mono,
                      lineHeight: 1,
                      transform: 'translateY(-5px)',
                    }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                gap: 1,
                minWidth: 0,
                borderLeft: `1px solid ${T.border}`,
              }}
            >
              {days.map((date, i) => {
                const dayLabel    = DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1];
                const isToday     = isSameDay(date, today);
                const dayMeetings = byDay.get(i) ?? [];

                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRight: `1px solid ${T.border}`,
                    }}
                  >
                    {/* Day header */}
                    <div
                      style={{
                        height: 40,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        borderBottom: `1px solid ${isToday ? 'rgba(240,90,50,0.35)' : T.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: T.mono,
                          letterSpacing: 0.8,
                          color: isToday ? T.coral : T.t4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {dayLabel}
                      </span>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: isToday ? T.coral : 'transparent',
                          fontSize: 11,
                          fontWeight: isToday ? 700 : 400,
                          color: isToday ? '#fff' : T.t2,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Grid body */}
                    <div style={{ position: 'relative', height: TOTAL_H }}>
                      {/* Hour lines */}
                      {hours.map((h) => (
                        <div
                          key={h}
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: (h - START_HOUR) * HOUR_PX,
                            height: 1,
                            background: T.border,
                            pointerEvents: 'none',
                          }}
                        />
                      ))}
                      {/* Half-hour lines */}
                      {hours.map((h) => (
                        <div
                          key={`${h}h`}
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: (h - START_HOUR) * HOUR_PX + HOUR_PX / 2,
                            height: 1,
                            background: 'rgba(255,255,255,0.025)',
                            pointerEvents: 'none',
                          }}
                        />
                      ))}
                      {/* Current time indicator */}
                      {i === todayIdx && nowTop >= 0 && nowTop <= TOTAL_H && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: nowTop,
                            height: 1,
                            background: T.coral,
                            zIndex: 10,
                            pointerEvents: 'none',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              left: -4,
                              top: -3.5,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: T.coral,
                            }}
                          />
                        </div>
                      )}
                      {/* Meeting blocks */}
                      {dayMeetings.map((m) => (
                        <MeetingBlock
                          key={m.id}
                          m={m}
                          isPast={new Date(m.starts_at) < today}
                          selected={selected?.id === m.id}
                          onClick={() => setSelected((s) => (s?.id === m.id ? null : m))}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Side panel ────────────────────────────────────────────────────── */}
      {selected && <SidePanel m={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

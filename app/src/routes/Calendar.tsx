import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';
import { Button } from '../design/primitives/Button';
import { SkeletonLines } from '../design/primitives/Skeleton';
import type { MeetingsResponse, UpcomingMeeting } from '../api/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short' }).toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Meeting row ──────────────────────────────────────────────────────────────

function MeetingRow({ m, isPast }: { m: UpcomingMeeting; isPast: boolean }) {
  const nav = useNavigate();
  const hasBot = !!m.bot;
  const botDone = m.bot?.status === 'done';
  const inCrm = !!m.prospect.pipedrive_person_id;

  // Past meetings without a bot are de-emphasised
  if (isPast && !hasBot) return null;

  return (
    <div
      onClick={() => m.id && nav(`/meeting/${m.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 16px',
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: R.lg,
        cursor: m.id ? 'pointer' : 'default',
        opacity: isPast ? 0.72 : 1,
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { if (m.id) e.currentTarget.style.background = T.bgElevate; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.bgCard; }}
    >
      {/* Date pill */}
      <div style={{
        width: 44,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}>
        <div style={{ fontSize: 9, fontFamily: T.mono, letterSpacing: 0.5, color: T.t4 }}>
          {fmtDay(m.starts_at)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {new Date(m.starts_at).getDate()}
        </div>
        <div style={{ fontSize: 9, fontFamily: T.mono, color: T.t4 }}>
          {new Date(m.starts_at).toLocaleDateString([], { month: 'short' })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: T.border, flexShrink: 0 }} />

      {/* Time + title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.title}
        </div>
        <div style={{ fontSize: 11, color: T.t3, fontFamily: T.mono, marginTop: 2 }}>
          {fmtTime(m.starts_at)}
          {m.prospect.name && m.prospect.name !== 'Unknown' && ` · ${m.prospect.name}`}
          {m.prospect.company && ` · ${m.prospect.company}`}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {inCrm && (
          <span style={{
            fontSize: 9, fontFamily: T.mono, letterSpacing: 0.4,
            color: T.sky, background: 'rgba(61,159,212,0.1)',
            border: '1px solid rgba(61,159,212,0.2)',
            borderRadius: R.pill, padding: '2px 7px', textTransform: 'uppercase',
          }}>CRM</span>
        )}
        {botDone && (
          <span style={{
            fontSize: 9, fontFamily: T.mono, letterSpacing: 0.4,
            color: T.green, background: 'rgba(22,163,74,0.1)',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: R.pill, padding: '2px 7px', textTransform: 'uppercase',
          }}>Recorded</span>
        )}
        {hasBot && !botDone && (
          <span style={{
            fontSize: 9, fontFamily: T.mono, letterSpacing: 0.4,
            color: T.sky, background: 'rgba(61,159,212,0.1)',
            border: '1px solid rgba(61,159,212,0.2)',
            borderRadius: R.pill, padding: '2px 7px', textTransform: 'uppercase',
          }}>Bot on</span>
        )}
        {m.id && <span style={{ fontSize: 13, color: T.t4 }}>›</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const nav = useNavigate();
  const { data, loading } = useApi<MeetingsResponse>('/api/meetings/upcoming');

  const now = new Date();
  const allMeetings = data?.meetings ?? [];

  // Upcoming: all future meetings
  const upcoming = allMeetings.filter(m => new Date(m.starts_at) >= now);
  // Past: only those with a bot (recording / transcript)
  const past = allMeetings
    .filter(m => new Date(m.starts_at) < now && !!m.bot)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  // Group upcoming by date-key
  function dateKey(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  function groupByDay(list: UpcomingMeeting[]) {
    const map = new Map<string, UpcomingMeeting[]>();
    list.forEach(m => {
      const k = dateKey(m.starts_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    });
    return map;
  }
  const upcomingByDay = groupByDay(upcoming);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.t3, marginBottom: 4 }}>MEETINGS</div>
          <h1 style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22, letterSpacing: -0.4, margin: 0, color: T.t1 }}>
            Your schedule
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => nav('/bot')}>Send a bot →</Button>
      </div>

      {loading && <SkeletonLines count={5} />}

      {!loading && data?.connected === false && (
        <div style={{ padding: 24, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: T.t2, marginBottom: 12 }}>Google Calendar not connected.</div>
          <Button variant="primary" size="sm" onClick={() => nav('/settings')}>Connect in Settings →</Button>
        </div>
      )}

      {!loading && data?.connected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Upcoming */}
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.t3, marginBottom: 12, textTransform: 'uppercase' }}>
              Upcoming — {upcoming.length}
            </div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 13, color: T.t3, padding: '8px 0' }}>No upcoming meetings.</div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  maxHeight: 480,
                  overflowY: 'auto',
                  paddingRight: 2,
                }}
              >
                {Array.from(upcomingByDay.entries()).map(([key, dayMeetings]) => {
                  const isToday = isSameDay(new Date(dayMeetings[0].starts_at), now);
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Day separator */}
                      <div style={{
                        fontSize: 9, fontFamily: T.mono, letterSpacing: 0.6, color: isToday ? T.coral : T.t4,
                        textTransform: 'uppercase', padding: '6px 4px 2px',
                      }}>
                        {isToday ? 'Today' : fmtDate(dayMeetings[0].starts_at)}
                      </div>
                      {dayMeetings.map(m => (
                        <MeetingRow key={m.id} m={m} isPast={false} />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past with bot */}
          {past.length > 0 && (
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.t3, marginBottom: 12, textTransform: 'uppercase' }}>
                Past — recorded
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
                {past.map(m => (
                  <MeetingRow key={m.id} m={m} isPast />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

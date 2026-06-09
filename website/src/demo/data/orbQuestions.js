export const orbAnswers = {
  'Why are we losing deals to Salesforce?': {
    answer:
      '4 deals lost to Salesforce in the last 60 days. In 3 of those, implementation timeline came up before value was established. Your top performers address timeline at minute 8 — your team average is minute 23. Recommend: add timeline framing to your discovery script.',
    source: 'Based on 847 conversations · Updated 2 hours ago',
  },
  'Which rep struggles most on pricing?': {
    answer:
      'Daan loses frame on pricing in 68% of his deals — the highest on the team. The pattern: he drops price before the prospect asks. Top performers wait for explicit pushback. Recommend: prescribed scenario from his last 3 pricing calls.',
    source: 'Based on 312 rep interactions · Updated 4 hours ago',
  },
  'What do our best clients have in common?': {
    answer:
      'Your top 20% of clients by ACV share 3 signals: CTO involved in first 2 calls, implementation timeline discussed in meeting 1, and a prior failed vendor mentioned in discovery. 8 of your current pipeline deals match all 3 signals.',
    source: 'Based on 1,204 client interactions · Updated 1 day ago',
  },
  "What changed in Jana's last 3 calls?": {
    answer:
      'Tone shifted from evaluative to cautious. Budget mentioned 4 times across the 3 calls vs 0 in her first 2. Salesforce came up in call 3 for the first time. Decision maker (CFO) has not been present since call 1. Risk: deal may be stalling at procurement.',
    source: 'Based on 5 interactions with Jana Novak · Updated today',
  },
  'Where does the team lose deals most often?': {
    answer:
      '67% of lost deals stall after meeting 3. The most common signal: next steps agreed on the call but not confirmed by email within 24 hours. Your top performers send a summary within 2 hours. Average team response time: 31 hours.',
    source: 'Based on 203 lost deals · Updated 3 days ago',
  },
  'What did customers say about pricing this quarter?': {
    answer:
      "Pricing came up in 78% of deals this quarter — up from 61% last quarter. Most common objection: 'We need to align with our procurement cycle.' This phrase appeared 23 times. It correlates with a 3-week deal extension on average. It is a delay tactic, not a hard no.",
    source: 'Based on 156 pricing conversations · Updated 6 hours ago',
  },
};

export const QUESTIONS = Object.keys(orbAnswers);

export const ORBIT_CONFIG = [
  { radius: 240, duration: 38, startDeg: 0 },
  { radius: 260, duration: 44, startDeg: 60 },
  { radius: 280, duration: 32, startDeg: 120 },
  { radius: 250, duration: 48, startDeg: 200 },
  { radius: 270, duration: 36, startDeg: 280 },
  { radius: 245, duration: 42, startDeg: 340 },
];

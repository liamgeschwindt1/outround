# Outround — Claude Project Context (V14 · June 2026)

## What is Outround?

**The commercial memory and coordination system for modern revenue teams.**

_CRMs store records. Outround stores reality._

Revenue teams lose because critical context disappears between conversations. Every call resets memory. Every rep rebuilds context. Every CRM becomes fiction five minutes after the meeting ends. Outround fixes this with persistent commercial memory and the coordination layer that turns memory into action.

This is **not** a practice tool, roleplay platform, training tool, or meeting recorder. It is the memory and coordination layer beneath every commercial conversation a company has.

## The product hierarchy (V14)

| Layer | Name         | What it does                                                                                                                              |
| ----- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Capture      | Meeting bot + bot-free capture. Every conversation enters the system.                                                                     |
| 2     | Memory       | Searchable relationship continuity. Account history. Stakeholder dynamics. Objection chains. The record that never resets.                |
| 3     | Coordination | Tasks created. Owners assigned. Reminders triggered. Workflows executed. The rep does not decide what happens next — it already happened. |
| 4     | Intelligence | Patterns surfaced. Coaching prescribed. Deal risks flagged. Pipeline forecasted from real signal.                                         |
| 5     | Autonomy     | Execution systems. Held in reserve until Layers 1–4 are embedded.                                                                         |

## V1 — Two workflows that must reach proof thresholds before anything else ships

**1. Pre-Meeting Intelligence Brief**
Delivered automatically in Slack 15 minutes before the meeting. Account history, stakeholder context, prior objections, deal risk flags, next-best questions. No dashboard. No searching. The intelligence arrives before the call.

**2. CRM Completion Engine**
After the meeting: CRM fields populated automatically with source citations, follow-up drafted, next steps structured. Every field links to the transcript line that generated it. Rep reviews instead of reconstructs.

Proof thresholds: ≥80% CRM field acceptance rate, ≥70% brief open rate unprompted at week 4.

## Positioning (non-negotiable)

- **The commercial memory and coordination system for modern revenue teams.**
- _CRMs store records. Outround stores reality._
- _Be fully present. Outround remembers the rest._

**Not:** call recording, revenue intelligence, meeting assistant, AI SDR, pipeline automation. These trigger procurement/IT/Gong comparison. "Memory and coordination system" does not.

## Language Rules

**Never use:** practice, roleplay, train, training, drill, coach (as verb), score, grade, round (as in practice round), persona, simulation

**Use:** brief, memory, context, coordination, capture, intelligence, CRM, follow-up, next steps, relationship, continuity, signal, digest

## ICP (Ideal Customer Profile)

- **Company size:** 10–50 employees
- **Stage:** Founder-led or early sales team, 1–10 reps
- **Motion:** Outbound-heavy B2B SaaS
- **CRM:** Pipedrive or HubSpot already installed
- **RevOps maturity:** None. No dedicated ops hire yet.
- **Geography:** Netherlands first. English-first (UK, Ireland, Nordic) if Dutch accuracy <70%.
- **Language:** Dutch and German accuracy tested on 50 real SMB calls before DACH launch. 70% CRM acceptance threshold. Not assumed.

## Pricing (V14)

| Tier       | Price          | For                                                                                                                                                                              |
| ---------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Founder    | €49/month      | 1 seat. Unlimited meetings. Pre-meeting brief. CRM completion. Slack delivery. Follow-up drafting. Basic memory timeline. 6-month founding cohort — migrates to Team at month 6. |
| Team       | €89/seat/month | Everything in Founder + manager digest, team memory, cross-call intelligence, deal risk detection, coordination workflows, coaching summaries, team search.                      |
| Enterprise | Custom         | Phase 3+. Not sold in V1.                                                                                                                                                        |

- Annual saves 15%
- No minimum seats
- 14-day free trial, no credit card required
- First 100 customers: €49 flat, all features, 12-month lock
- No free tier — trial is the entry mechanic
- No overage charges, no AI billing anxiety

## Tech Stack (V14)

| Layer           | Tool                                |
| --------------- | ----------------------------------- |
| Meeting capture | Recall.ai (EU region: eu-central-1) |
| Transcription   | Gladia (EU-hosted, multilingual)    |
| CRM             | HubSpot first, Pipedrive second     |
| Intelligence    | Claude API                          |
| Delivery        | Slack (webhooks + action buttons)   |
| Payments        | Stripe                              |
| Auth            | Supabase                            |
| Orchestration   | GitHub Actions (cron layer)         |

## The moat (four compounding assets)

1. **Longitudinal relationship graph** — every stakeholder, objection, deal evolution. After 6 months a new tool sees nothing. Outround sees everything.
2. **Behavioural GTM intelligence** — which messaging converts for this specific team. Cannot be replicated without access to the same conversations.
3. **Embedded coordination workflows** — when Outround creates tasks and triggers workflows, other tools depend on Outround. Switching cost = rebuilding operational infrastructure.
4. **Trust history** — the accumulated record of Outround being right. Psychologically risky to replace once trust is established.

The moat is not transcripts (commodity). It is what the system understands about how this specific company sells, built over hundreds of conversations.

## GTM — The adoption path

| Step | Who                            | Why                                                                                              |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| 1    | Rep installs on credit card    | Solves CRM admin pain immediately. No permission needed. Value before the next meeting.          |
| 2    | Manager receives weekly digest | Discovers value without the rep selling upward. Makes the manager look smart in pipeline review. |
| 3    | Manager buys team plan         | Has data justifying the expense. Reps already using it. No pilot required.                       |

The real competitor is "I'll update it later." Not Gong. Not Modjo. The blank Notion page and the rep who believes their memory is sufficient.

## Competitive Landscape

|                   | Gong          | Modjo                | Grain       | Outround            |
| ----------------- | ------------- | -------------------- | ----------- | ------------------- |
| Market            | US enterprise | French/EU enterprise | SMB         | EU SMB              |
| Pricing           | $100+/seat    | €60+/seat            | $15-19/seat | €49-89/seat         |
| Memory layer      | ✗             | ✗                    | ✗           | ✓ Core              |
| Coordination      | ✗             | ✗                    | ✗           | ✓ Phase 2           |
| Pre-meeting brief | ✗             | ✗                    | ✗           | ✓ V1                |
| CRM completion    | Partial       | Partial              | ✗           | ✓ V1 with citations |
| Dutch/German      | ✗             | Partial              | ✗           | ✓ Tested threshold  |

## Two Signals That Matter

- Signal 1: A rep opens the pre-meeting brief unprompted and it changes what they say in the first five minutes of the call.
- Signal 2: A VP renews without a check-in call because the team is hitting quota and the digest is telling them everything they need to know.

## Expansion Phases

| Phase                    | Unlock condition                                               |
| ------------------------ | -------------------------------------------------------------- |
| Phase 1 — Memory capture | CRM acceptance ≥80%, brief open rate ≥70% unprompted at week 4 |
| Phase 2 — Coordination   | Week-4 retention ≥70%, managers changing decisions from digest |
| Phase 3 — Intelligence   | Phase 2 unit economics proven, gross margin >70%               |
| Phase 4 — Company memory | Multiple teams inside accounts using Outround                  |

## Data ownership

- Raw audio: deleted within 24h
- Raw transcripts: deleted within 30 days
- Structured metadata: owned by customer, fully exportable
- EU AI Act Article 5(1)(f) compliant — no biometric emotion inference
- Verbal consent logged on every call
- EU-hosted infrastructure

## Current Priorities (June 2026)

1. Prove V1 on 5 real Dutch teams
2. Hit ≥80% CRM acceptance and ≥70% unprompted brief open rate
3. Ship internal dashboard
4. Dutch + German accuracy testing on 50 real SMB calls before DACH launch
5. First 100 founding customers at €49 flat

## Files in This Project

- `Master V14` — master strategy document (authoritative)
- `product_management/` — task and jobs-to-be-done management

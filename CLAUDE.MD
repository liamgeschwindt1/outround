# Outround — Claude Project Context

## What is Outround?

AI-powered **pre-performance readiness platform** for professionals facing high-stakes spoken moments. Not a training tool — a readiness tool. "The round before it counts."

**Core loop:** Select mode → 30s brief → brief disappears → practice call against AI persona → AI pushes back/objects → structured score + streaming feedback → go again.

## Positioning (non-negotiable)

- **They train. You ready.**
- Category: readiness, not training
- Tagline: _"The round before it counts."_
- Hero lines: _"You wouldn't send the proposal without checking it first. Why are you making the call cold?"_

## Language Rules

**Never use:** train, training, learn, drill, course, module, session, exercise, enablement, coaching programme, soft skills

**Always use:** ready, prepare, round, go again, perform, sharp, before the call, beat, score, challenge

## Product Modes (current)

1. Cold Calls (live)
2. Investor Pitches (locked)
3. Customer Discovery (locked)
4. Sales Calls (locked)
5. High-Stakes Negotiations (locked)

Dropped: difficult conversations, job interviews, media/PR, customer service.

## Target Customers

**Primary beachhead:** European SMB sales teams (10–100 person), VP Sales buyers  
**Secondary:** Founders (investor pitches, customer discovery)  
**Tertiary:** Consultants, lawyers, fund managers  
**Evangelists:** Founders in zero-to-one phase + competitive SDRs/BDRs

## Pricing

| Tier   | Individual | Team (per seat, min 3) |
| ------ | ---------- | ---------------------- |
| Basic  | €29/mo     | €49/seat               |
| Growth | €79/mo     | €99/seat               |
| Pro    | €149/mo    | €129/seat              |

Annual = 20% discount. No freemium — 14-day Growth trial only.

## Tech Stack

| Layer                   | Tool                        |
| ----------------------- | --------------------------- |
| Conversation            | Vapi.ai                     |
| Voice                   | ElevenLabs Premium          |
| Transcription + metrics | AssemblyAI                  |
| Vocal affect            | Hume AI                     |
| Grading + feedback      | Claude API (~€0.02/session) |

## Key Persona

**Hendrik van der Berg** — CFO, Vandermeer Logistics, Amsterdam 🇳🇱  
Traits: skeptical, time-poor, direct, data-driven. Resistance level 3.  
Phonetic variants: Hendrick, Hendric, Henrik — never penalise rep for STT spelling errors.

## Viral Mechanic

Landing page = demo. Visitor calls Hendrik, gets scored (e.g. 67/100), detailed breakdown blurred until email captured. LinkedIn share: _"I scored 67/100 against an AI Dutch CFO. Think you can beat it?"_  
Structurally unreplicable by Hyperbound/Second Nature without burning their enterprise GTM brand.

## Competitive Landscape

|                | Hyperbound    | Second Nature | Pitchbase    | Outround     |
| -------------- | ------------- | ------------- | ------------ | ------------ |
| Funding        | $18M          | $38M          | Bootstrapped | Pre-seed     |
| Market         | US enterprise | US enterprise | French SMB   | European SMB |
| Pricing        | $20k+/yr      | $20k+/yr      | $20–59/mo    | €29–149/mo   |
| Interruptions  | ✓             | ✗             | ✓            | ✓            |
| Tone analysis  | ✗             | ✗             | ✗            | ✓ Hume AI    |
| Meeting bot    | ✗             | ✗             | ✗            | Phase 2      |
| Viral mechanic | ✗             | ✗             | ✗            | Core         |

**Most dangerous competitor:** Pitchbase — solo European founder, 6–12 months ahead in France, self-serve. Their trap: pipeline metaphor can't extend beyond sales verticals.

**Critical gap all competitors share:** Tone blindness — they analyse transcripts, not voices.

## Key Differentiators

1. **Tone/affect analysis** via Hume AI — no competitor has this
2. **Streaming feedback** — no loading screen delay
3. **Pre-performance positioning** — not training, readiness
4. **European-first personas** — Dutch, German, Nordic
5. **Vertical agnostic architecture** — session-based, not pipeline-based
6. **Phase 2 meeting bot** — full practice → perform → analyse loop

## Current Priorities (May 2026)

1. Two CEO demos in person — feedback only, not sales
2. Fix debug log, ship internal dashboard
3. Fix Hendrik name handling in grading prompt
4. Week 3: seed leaderboard with 15 network contacts
5. Week 4: first LinkedIn launch post (founder voice, vulnerable, direct challenge)

## Two Signals That Matter

- Strangers complete the demo without being asked
- Strangers share it without being asked

## Funding Path

- Pre-seed €300–500k when: viral demo works organically + 5 paying teams converted without sales calls
- Trigger: first €50k MRR with retention data

## Files in This Project

- `Outround_overview_` — business overview narrative
- `outround-master.txt` — master strategy doc (most complete)
- `outround-competitive-intelligence.docx` — competitive research with direct product testing
- `language` — brand language rules
- `GTM` — go-to-market sequencing month by month
- `outround_projections_v2.xlsx` — financial projections

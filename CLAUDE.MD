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

## Development Workflow

### Formatter + Linter (always run before marking work complete)

Prettier and ESLint are configured at the monorepo root. Every change that touches source files **must** pass both before being considered done.

| Step              | Command                | Notes                                          |
| ----------------- | ---------------------- | ---------------------------------------------- |
| Format            | `npm run format`       | Prettier — auto-fixes whitespace, quotes, etc. |
| Lint              | `npm run lint`         | ESLint — reports violations                    |
| Lint + auto-fix   | `npm run lint:fix`     | ESLint — applies auto-fixable rules            |
| Check format only | `npm run check-format` | CI-friendly, no writes                         |

**Config files:**

- Prettier: [`.prettierrc`](.prettierrc) — single quotes, semicolons, 100 char width, trailing commas (ES5), LF line endings
- ESLint: [`eslint.config.mjs`](eslint.config.mjs) — per-directory configs:
  - `app/src/**/*.{ts,tsx}` — strict + stylistic TypeScript with React/React Hooks/React Refresh plugins
  - `**/*.js` / `**/*.mjs` (server, backend, demo, internal) — CommonJS + Node globals
  - `app/public/js/**` — browser scripts loaded via HTML `<script>` tags (no-unused-vars off because functions are called from HTML)
  - `website/src/**/*.jsx` — JSX without TypeScript
  - Prettier config is merged last to disable conflicting ESLint rules

**Typical post-change checklist:**

```bash
npm run format        # auto-fix formatting
npm run lint:fix      # auto-fix lint issues
npm run lint          # confirm clean
```

### TypeScript type-checking (frontend)

From the `app/` workspace:

```bash
cd app && npm run typecheck   # tsc --noEmit
```

This checks all of `app/src/**/*.{ts,tsx}` and `app/vite.config.ts`. The `tsconfig.json` uses `projectService: true` (referenced by ESLint as well).

### E2E tests (Playwright)

The E2E suite lives in [`app/e2e/`](app/e2e/). It uses Playwright with a single Chromium project and runs against the Vite dev server (`localhost:3000`).

**Running tests:**

| Command                  | Where  | What it does                             |
| ------------------------ | ------ | ---------------------------------------- |
| `npm run test:e2e`       | `app/` | Headless run (CI / terminal)             |
| `npm run test:e2e:ui`    | `app/` | Interactive UI mode                      |
| `npm run test:e2e:debug` | `app/` | Debug mode, headed browser, step-through |

**Test architecture:**

- **Custom fixture** — [`helpers/index.ts`](app/e2e/helpers/index.ts) exports a `test` fixture with a `mockAuth(page, state)` helper. Import from `'../helpers'` instead of `@playwright/test`.
- **Auth mocks** — [`mocks/auth.ts`](app/e2e/mocks/auth.ts) intercepts `/api/auth/*` calls (login, signup, session). States: `'unauthenticated'`, `'new-user'` (authenticated but not onboarded), `'onboarded'`.
- **API mocks** — [`mocks/api.ts`](app/e2e/mocks/api.ts) sets up default mock responses for backend API routes (dashboard, etc).
- **Convenience navigators** — `goTo(page, path)`, `goToLoggedOut(page, path)`, `goToNewUser(page, path)` set up mocks + navigate in one call.
- **Tests** — located in `app/e2e/tests/`. Current coverage: login, navigation, routing, onboarding.

**When to run E2E tests:**

- After any change to `app/src/` components, routes, or auth logic
- After any change to `app/server.js` (Express server, proxies, middleware)
- After any change that touches routing or navigation

**Key config:** [`playwright.config.ts`](app/e2e/playwright.config.ts) — 30s test timeout, 10s expect timeout, `fullyParallel: true`, server reuse on (`!CI`), 1 retry in CI, HTML reporter.

**Note:** There are no backend unit tests currently. Backend changes must be verified manually or by running the E2E suite (which exercises the full stack through the browser).

## Files in This Project

- `Outround_overview_` — business overview narrative
- `outround-master.txt` — master strategy doc (most complete)
- `outround-competitive-intelligence.docx` — competitive research with direct product testing
- `language` — brand language rules
- `GTM` — go-to-market sequencing month by month
- `outround_projections_v2.xlsx` — financial projections

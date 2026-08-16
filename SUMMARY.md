# DNA — Work Summary

**App:** DNA (Data, Network, Alignment)  
**Live URL:** https://dna-vana.vercel.app  
**Repo:** https://github.com/KAMEVETRICS/DNA  
**Purpose:** Vana Cup data app — private identity from user-approved sources + friend compatibility  
**Stack:** Next.js 16 · React 19 · TypeScript · `@opendatalabs/vana-sdk` · Vercel · mainnet  

This document summarizes the full arc of work done on the project: audit against Cup rules, multi-source Vana integration, mainnet ship, listing assets, tester-first UX, and polish.

---

## 1. Starting point (what we found)

Before this work, DNA was a strong **visual prototype** with:

- Polished landing UI and privacy messaging  
- A **live Vana path for Spotify only** (`spotify.savedTracks`)  
- Multi-source UI (ChatGPT, YouTube, GitHub, LinkedIn, Instagram) that was **preview/mock**  
- Local score weights for “pick 3 sources” — no Vana reads  
- Static friend-match card (“Maya / 87%”)  
- Fake invite link  
- **Moksha (testnet)** configuration, not Cup-scoring mainnet  

**Gap vs [builders.vana.org](https://builders.vana.org):** Cup Goals/Assists only count **mainnet paid first-reads**. Preview mode and mock match did not score. Five of six UI sources already existed as real Vana connectors but were not wired.

---

## 2. What we built

### 2.1 Multi-source live Vana integration

Every listed source is a real connector, one approval per source (protocol limit):

| Source | Scopes |
|--------|--------|
| ChatGPT | `chatgpt.memories` |
| Spotify | `spotify.savedTracks` |
| YouTube | `youtube.history`, `youtube.subscriptions` |
| GitHub | `github.profile`, `github.contributions`, `github.repositories` |
| LinkedIn | `linkedin.profile`, `linkedin.skills`, `linkedin.experience` |
| Instagram | `instagram.profile`, `instagram.following` |

**Backend**

- `lib/sources.ts` — source registry  
- `lib/vana.ts` — per-source `createDirectDataController` cache; **mainnet default** (`moksha` only if forced)  
- `POST /api/vana/request` — body `{ source }`, session cookies for request + source  
- `GET /api/vana/status` / `GET /api/vana/data` — ownership check, paid read, one-shot cache  
- Rate limiting on request creation  
- Explicit source required (no Spotify fallback)

**Frontend**

- `VanaSourceConnect` — reusable connect per source (`useDirectVanaConnect`)  
- Profile merge from multiple verified signals  
- Aggregate-only scoring in `lib/dna-profile.ts`  
- Invite links encode aggregate traits only  
- Live compatibility when both sides have verified DNA  

**Removed**

- Preview-only multi-select DNA generation  
- Hardcoded “Maya” match as the only path  
- Spotify-only connect component  

### 2.2 Mainnet / Cup readiness

- Default network: **mainnet**  
- README + `.env.example` updated for Cup  
- Production verified: create-request returns real `dcr_*` + approval URL  
- App address (at last check): `0x8aDfBEfF8500E24973718f358A6CdFaCFf7d2fCe`  
- Deployed on Vercel with mainnet env (user-confirmed)  

### 2.3 Listing assets & copy

For Cup / builders listing:

| Field | Value |
|-------|--------|
| Name | DNA |
| Website | https://dna-vana.vercel.app |
| Logo URL | https://dna-vana.vercel.app/logo.png |
| Fallbacks | `/logo.jpg`, `/logo.svg`, `/og.png` |

Files: `public/logo.png`, `public/logo.jpg`, `public/logo.svg`, `LISTING.md` (short + medium + long descriptions).

### 2.4 Tester-first UX (Connect → Invite → Match)

Homepage restructured so testers do not bury the product under marketing:

1. **Connect** any live source through Vana (first Goal)  
2. **Connect another source** (another first-read)  
3. **Invite** someone → they connect → **live match**  

Highlights:

- Nav: `1. Connect` · `2. Invite` · `3. Match`  
- Hero: mission checklist, not a decorative-only profile  
- Start card: source **picker** (nothing pre-selected) + large Connect CTA  
- Builder **before** “how it works” essay  
- After verify: next-action callout (another source + copy invite)  
- Sticky dock always shows the next action  
- Invite URL peers get a top banner to connect  
- Empty state = step-by-step test path  

### 2.5 Source neutrality

Spotify is **not** special:

- No pre-selected source  
- No API default to `spotify`  
- No “start with Spotify” product path  
- Next CTAs say “Connect another source,” not a forced source name  
- Invite fallback no longer invents a Spotify signal  

### 2.6 UI polish

- **Connect another source** button contrast fix: start-card link styles were forcing black text on a black pill; label is now paper/off-white with lime arrow  

---

## 3. Key files

| Path | Role |
|------|------|
| `app/page.tsx` | Landing, mission, picker, builder, match, sticky dock |
| `app/components/VanaSourceConnect.tsx` | Per-source Vana connect UI |
| `app/api/vana/*/route.ts` | Request / status / paid data read |
| `app/connect/return/page.tsx` | Post-approval tab |
| `lib/sources.ts` | Source + scope registry |
| `lib/vana.ts` | Controllers, network, cookies |
| `lib/dna-profile.ts` | Aggregate scoring, merge, invite encode/decode, compatibility |
| `app/globals.css` | Full visual system + tester UX styles |
| `public/logo.*` | Listing logo assets |
| `LISTING.md` | Paste-ready Cup listing copy |
| `README.md` | Dev + deploy + Cup checklist |

---

## 4. Git commits (this effort)

Newest first:

| Commit | Change |
|--------|--------|
| `d56e699` | Fix Connect another source button contrast |
| `8761e6f` | Stop treating Spotify as default anywhere |
| `dbfca01` | Source picker — start with any live source |
| `e05b6c3` | Tester-first UX: connect / extra sources / invite |
| `a3cf535` | Logo assets + listing description copy |
| `7b5adf3` | Remove obsolete Spotify-only component |
| `4fa869e` | Multi-source Vana mainnet DNA for Cup scoring |

Branch: `main` → `origin/main` (https://github.com/KAMEVETRICS/DNA)

---

## 5. Product behavior today

1. User opens https://dna-vana.vercel.app  
2. Syncs a source on [app.vana.org/sources](https://app.vana.org/sources) (**Mainnet**)  
3. Picks that source in DNA → **Connect with Vana** → approves  
4. Server paid-reads → aggregate traits only → verified profile in `localStorage`  
5. User can connect more sources (separate approvals)  
6. **Copy invite** shares aggregate-only DNA  
7. Peer opens invite, connects their source(s) → compatibility scores  

Privacy: raw history not shown or retained by DNA; aggregates + evidence strings only.

---

## 6. Cup scoring alignment

| Cup rule | DNA status |
|----------|------------|
| SDK + live app | Done |
| Mainnet | Done (user redeployed with mainnet details) |
| Goal (+1 first-read of a source) | Live path per source |
| Assist (+2 other apps read data you introduced) | Product invite loop; network assists depend on ecosystem reuse |
| Listing (name, logo, website) | Assets + copy ready; listing submission is operator-side |

---

## 7. Operator checklist (outside code)

- [x] Multi-source Vana code  
- [x] Mainnet deploy (user confirmed)  
- [x] Logo URL live  
- [ ] Mainnet escrow funded for app identity  
- [ ] Cup listing completed (name + logo URL + website) on builders.vana.org  
- [ ] End-to-end test: sync → approve → verified DNA → invite → second user match  
- [ ] Confirm Goals appear on the Cup table after real first-reads  

---

## 8. What was intentionally not built

- Server-side user accounts / profile DB (browser `localStorage` only)  
- Multi-source in a **single** Vana approval (protocol limitation)  
- New data connectors (uses existing PDP catalog)  
- Automated Cup Assist farming beyond invite/share of aggregates  

---

## 9. Daily check-in (traction)

Client-side daily sign-in (`lib/daily-checkin.ts`, `DailyCheckin` component):

- One claim per local calendar day  
- Streak + total days in `localStorage`  
- Does **not** re-hit Vana escrow or invent Goals  
- After claim, mission CTA points at connect / another source / invite / match based on progress  

Cup Goals still only come from **first-reads**. Daily check-in is for retention and routing people into those actions.

---

## 10. One-line summary

**DNA went from a Moksha Spotify prototype with mock multi-source UI to a mainnet multi-source Vana app that steers testers through connect → more sources → invite/match, with listing assets, daily check-in for retention, and Cup-aligned scoring paths.**

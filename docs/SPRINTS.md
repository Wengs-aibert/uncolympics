# UNCOLYMPICS — Sprint Plan

> Based on ARCHITECTURE.md v1.0 (locked)

---

## Sprint 0 — Foundation (Day 1)
> Get the project scaffolded, Supabase connected, basic routing working.

- [ ] **0.1** Scaffold React + Vite + TypeScript project
- [ ] **0.2** Install deps: `zustand`, `framer-motion`, `@supabase/supabase-js`, `react-router-dom`
- [ ] **0.3** Set up Supabase project (free tier) — get URL + anon key
- [ ] **0.4** Create Supabase migration: full schema (`001_initial.sql`)
- [ ] **0.5** Set up Supabase Row Level Security (RLS) policies
- [ ] **0.6** Create `src/lib/supabase.ts` — client init
- [ ] **0.7** Set up React Router with all page routes
- [ ] **0.8** Create Zustand store skeleton (`gameStore.ts`)
- [ ] **0.9** Set up Tailwind CSS + dark theme + neon accent color palette
- [ ] **0.10** Create basic layout shell (header, mobile-first container)
- [ ] **0.11** Deploy to Vercel (empty shell, confirms pipeline works)

**Done when:** App loads on Vercel, connects to Supabase, dark theme renders.

---

## Sprint 1 — Create & Join Tournament
> The entry point — create a room or join one.

- [ ] **1.1** `Home.tsx` — two buttons: "Create Tournament" / "Join Tournament"
- [ ] **1.2** Create flow: name, room code (custom, max 5 chars), # of games → writes to `tournaments` + `players` (referee)
- [ ] **1.3** Room code validation: check uniqueness against active tournaments, max 5 chars, alphanumeric
- [ ] **1.4** Join flow: enter room code → validate exists + is in lobby status
- [ ] **1.5** Player registration: enter name → write to `players` with `device_id` (generated + stored in localStorage)
- [ ] **1.6** Role assignment: join as Player or Spectator
- [ ] **1.7** Time estimate display: `num_games × 20 min` shown on create
- [ ] **1.8** Error handling: invalid code, full lobby, tournament already started

**Done when:** Referee can create a tournament, players can join via code, data is in Supabase.

---

## Sprint 2 — Lobby + Teams
> Team formation, leader selection, real-time sync starts here.

- [ ] **2.1** `Lobby.tsx` — shows all joined players, team panels, spectator list
- [ ] **2.2** Team creation: referee sets team names (or defaults: Team A / Team B)
- [ ] **2.3** Player team selection: tap to join a team, switch freely until locked
- [ ] **2.4** Team leader voting: players on a team vote for leader, majority wins
- [ ] **2.5** Real-time sync: `src/lib/sync.ts` — subscribe to `players` + `teams` tables for this tournament
- [ ] **2.6** Lobby state renders live: new joins, team switches, leader votes update for everyone
- [ ] **2.7** Referee "Start Tournament" button: validates ≥2 teams with ≥1 player each + leaders chosen
- [ ] **2.8** Reconnection: on refresh, use `device_id` to find existing player record and rejoin
- [ ] **2.9** Spectator view: sees lobby but no team controls

**Done when:** Multiple devices see the same lobby state in real-time. Teams formed, leaders voted, referee can start.

---

## Sprint 3 — Game Pick + Built-In Game Types
> Team leaders alternate picking games.

- [ ] **3.1** Seed built-in game types into `game_types` table (7 default games with title definitions)
- [ ] **3.2** `GamePick.tsx` — current team leader sees available (unpicked) games as cards
- [ ] **3.3** Non-leaders see "Waiting for [Leader] to pick..." with live update
- [ ] **3.4** Pick alternation logic: track `current_pick_team` on tournament, flip after each pick
- [ ] **3.5** Game card design: emoji + name + brief description + estimated time
- [ ] **3.6** On pick: create `games` row (status: `active`), broadcast to all
- [ ] **3.7** All devices transition to GamePlay screen

**Done when:** Leaders can alternate picking games, everyone sees the pick in real-time.

---

## Sprint 4 — Game Play + Score Input
> The core gameplay screen — context display + stat input.

- [ ] **4.1** `GamePlay.tsx` — dynamic layout based on `game_type`
- [ ] **4.2** Game context display: rules, what's being tracked, current status (all roles see this)
- [ ] **4.3** Player stat input: render input fields based on `game_type.player_inputs` — only for stats relevant to that player
- [ ] **4.4** Referee score input: render based on `game_type.referee_inputs` — winner selection, game-specific data
- [ ] **4.5** Stat submission: writes to `player_stats`, broadcast live
- [ ] **4.6** Live stat feed: all devices see stats coming in (e.g. "Eric reported 4 cups made")
- [ ] **4.7** Referee "End Game" button: locks stat input, writes `game_results`, transitions to title calculation
- [ ] **4.8** Input validation: prevent duplicates, reasonable ranges
- [ ] **4.9** Spectator view: sees live stats feed, no inputs

**Done when:** Players can input stats, referee can end game, all synced in real-time.

---

## Sprint 5 — Title Engine + Title Reveal
> The Mario Party moment. Bonus stars, but for Uncolympics.

- [ ] **5.1** `src/lib/titles.ts` — title engine: takes `player_stats[]` + `game_results` + `title_definitions[]`, outputs `Title[]`
- [ ] **5.2** Condition evaluators: `highest()`, `lowest()`, `exact()`, `flag()`, `threshold()`
- [ ] **5.3** Title calculation runs on referee's client after game ends → writes `titles` rows to Supabase
- [ ] **5.4** `TitleReveal.tsx` — animated reveal screen
- [ ] **5.5** One-by-one title animation: title pops in → player name → description → points (Framer Motion)
- [ ] **5.6** Sound/haptic cue per reveal (optional: vibration API on mobile)
- [ ] **5.7** Points auto-tally: each title adds +0.5 to player's team `total_points`
- [ ] **5.8** After all titles revealed: show updated scoreboard snapshot
- [ ] **5.9** Referee "Next" button → back to GamePick (or Ceremony if last game)

**Done when:** Titles auto-calculate and reveal with animation. Points update. It feels like Mario Party.

---

## Sprint 6 — Scoreboard
> Running totals visible anytime.

- [ ] **6.1** `Scoreboard.tsx` — accessible via nav/tab at any point during tournament
- [ ] **6.2** Team scores: bar chart or visual comparison
- [ ] **6.3** Title leaderboard: which players have the most titles
- [ ] **6.4** Game history: list of completed games with winners + titles awarded
- [ ] **6.5** Per-player breakdown: tap a player to see their stats + titles across all games
- [ ] **6.6** Real-time: updates live as games complete

**Done when:** Anyone can check scores mid-tournament with full breakdowns.

---

## Sprint 7 — Awards Ceremony
> The grand finale.

- [ ] **7.1** `Ceremony.tsx` — triggered after last game's title reveal
- [ ] **7.2** Global title engine: calculate tournament-wide titles (MVP, Late Bloomer, Title Hoarder, etc.)
- [ ] **7.3** Dramatic reveal sequence: global titles one-by-one with bigger/slower animations
- [ ] **7.4** Winning team reveal: build suspense → final score → winner crowned
- [ ] **7.5** Confetti / celebration animation for winning team
- [ ] **7.6** Tournament summary card: shareable (screenshot-friendly layout)
- [ ] **7.7** Save to history: tournament status → `completed`, all data persisted
- [ ] **7.8** "Play Again" / "New Tournament" / "View History" options

**Done when:** Tournament ends with a dramatic ceremony. Results are saved.

---

## Sprint 8 — Custom Games + History
> Extensibility and replayability.

- [ ] **8.1** Custom game creator UI: referee can add a game type with name, emoji, description
- [ ] **8.2** Custom stat input builder: define what players/referee input (stat key + label + type)
- [ ] **8.3** Custom title builder: define conditions using dropdown (highest/lowest/exact/flag/threshold) + stat key
- [ ] **8.4** Custom games saved to `game_types` with `tournament_id`
- [ ] **8.5** `History.tsx` — list past completed tournaments
- [ ] **8.6** Tournament detail view: full recap — games, scores, titles, ceremony results
- [ ] **8.7** Filter/search history

**Done when:** Referee can create fully custom games. Past tournaments are browsable.

---

## Sprint 9 — Polish + Deploy
> Make it feel good.

- [ ] **9.1** Mobile responsiveness pass — every screen tested on phone
- [ ] **9.2** Animation polish: transitions between pages, loading states
- [ ] **9.3** Error boundaries + offline handling (show "reconnecting..." if sync drops)
- [ ] **9.4** Favicon, meta tags, OG image for sharing
- [ ] **9.5** Final Vercel deploy with custom domain (if desired)
- [ ] **9.6** README.md with setup instructions
- [ ] **9.7** End-to-end test: run a full mock tournament

**Done when:** Ship it. Ready for game day. 🎮

---

## Estimated Timeline

| Sprint | Effort | Focus |
|--------|--------|-------|
| 0 | ~2-3 hours | Foundation |
| 1 | ~3-4 hours | Create/Join |
| 2 | ~4-5 hours | Lobby + Realtime |
| 3 | ~2-3 hours | Game Pick |
| 4 | ~4-5 hours | Gameplay + Scoring |
| 5 | ~4-5 hours | Title Engine + Reveal |
| 6 | ~2-3 hours | Scoreboard |
| 7 | ~3-4 hours | Ceremony |
| 8 | ~4-5 hours | Custom Games + History |
| 9 | ~2-3 hours | Polish |
| **Total** | **~30-40 hours** | |

---

## How We Work

- **One sprint at a time.** Don't skip ahead.
- **Eric drives.** I help architect, review, and build alongside.
- **Each sprint ends with a working deploy.** Incremental progress, always shippable.
- **Questions go to #architecture.** Decisions get logged.

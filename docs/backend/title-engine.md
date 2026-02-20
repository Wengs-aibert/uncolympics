# Title Engine

Titles are the core scoring mechanic. Players earn titles based on game stats → titles award +0.5 team points each.

---

## Per-Game Titles (`src/lib/titles.ts`)

### How It Works
1. `calculateTitles(gameId)` is called after a game ends
2. Fetches all `player_stats` for that game
3. Fetches the game's `title_definitions` from `game_types`
4. Evaluates each definition's condition against the stats
5. Returns array of `{ playerId, titleName, titleDesc, isFunny, points: 0.5 }`

### Condition Types

| Type | Logic | Example |
|------|-------|---------|
| `highest` | Player(s) with max value for stat_key | Most cups made |
| `lowest` | Player(s) with min value (must have stat row) | Fastest time |
| `exact` | Player(s) where stat_value === value | Exactly 0 cups |
| `flag` | Player(s) where stat_value === 1 | Sank last cup |
| `threshold` | Player(s) where stat_value >= value | 5+ bags in hole |

### Title Definition Format (JSONB in game_types)
```json
[
  {
    "name": "Sniper",
    "desc": "Made the most cups",
    "isFunny": false,
    "condition": { "type": "highest", "stat": "cups_made" }
  },
  {
    "name": "Emotional Support",
    "desc": "Made 0 cups",
    "isFunny": true,
    "condition": { "type": "exact", "stat": "cups_made", "value": 0 }
  }
]
```

### Tie Rules
- **Ties for highest/lowest:** ALL tied players get the title and earn +0.5 each
- **Opposite teams tied:** 0 bonus points (cancels out) — *not yet implemented in engine, handled by frontend/ceremony*
- **Same team tied:** +0.25 each (half normal) — *same*

---

## Built-In Game Titles

### 🍺 Beer Pong
- **Sniper** — highest cups_made
- **Emotional Support** — exact 0 cups_made
- **Clutch Gene** — flag last_cup

### 🥤 Rage Cage
- **Rage Monster** — highest sinks
- **Pacifist** — lowest sinks

### 🏎️ Mario Kart
- **Speed Demon** — highest first_places
- **Scenic Route** — highest last_places
- **Consistent** — flag consistent_placement

### 👊 Smash Bros
- **Destroyer** — highest kos
- **Survivor** — highest last_alive_count
- **Glass Cannon** — flag glass_cannon

### 🏓 Pickleball
- **The Wall** — flag longest_rally
- **Lightning** — flag fastest_point

### 🎯 Cornhole
- **Bullseye** — highest bags_in_hole
- **Throwing Blind** — exact 0 bags_in_hole

### 🏃 Obstacle Course
- **Flash** — lowest completion_time
- **Scenic Route** — highest completion_time
- **Photo Finish** — flag photo_finish

---

## Global Titles (`src/lib/globalTitles.ts`)

Awarded at the ceremony after all games are complete. Stored with `game_id = null`.

### `calculateGlobalTitles(tournamentId)`

| Title | Condition |
|-------|-----------|
| 🏆 **MVP** | Most total titles across all games |
| 🎯 **Title Hoarder** | Titles across the most different games (min 2) |
| 📈 **Late Bloomer** | More titles in 2nd half of games than 1st half |
| 🔄 **Consistent** | Same title name earned in 2+ different games |
| 😂 **Comic Relief** | Most funny titles (is_funny=true) |

### Edge Cases
- **MVP tie:** All tied players get it
- **Late Bloomer:** Requires ≥2 games total
- **Title Hoarder:** Requires titles in ≥2 different games
- **Consistent:** Only one "Consistent" award per player (even if multiple repeat titles)
- **Comic Relief:** Only awarded if ≥1 funny title exists

---

## Points Flow
1. Game ends → `calculateTitles(gameId)` → `saveTitles()`
2. `updateTeamPoints(tournamentId)` sums all title points by team
3. After all games → `calculateGlobalTitles()` → `saveGlobalTitles()`
4. Final `updateTeamPoints()` for global title bonuses
5. Team with most points = **UNCOLYMPICS Champions**

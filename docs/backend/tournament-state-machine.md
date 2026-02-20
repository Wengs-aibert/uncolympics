# Tournament State Machine

## Tournament Status Flow

```
lobby → picking → playing → scoring → picking (loop) → completed
```

| Status | What's Happening | Triggered By |
|--------|-----------------|--------------|
| **lobby** | Players joining, forming teams, voting leaders | `createTournament()` |
| **picking** | Team leader selects next game | `startTournament()` or `advanceToNextRound()` |
| **playing** | Active game — players submitting stats | `pickGame()` |
| **scoring** | Title reveal phase after game ends | `endGame()` |
| **completed** | All games done, ceremony | `advanceToNextRound()` (last game) |

### Loop: picking → playing → scoring → picking
Each game cycle goes through: pick → play → score → (back to pick or ceremony).

---

## Game Status Flow

```
active → titles → completed
```

| Status | Triggered By |
|--------|--------------|
| **active** | `pickGame()` — game is being played |
| **titles** | `endGame()` — title calculation + reveal |
| **completed** | `advanceToNextRound()` — done, next game |

---

## Who Can Trigger What

| Action | Who | Validation |
|--------|-----|------------|
| Start tournament | Any (referee implied) | ≥2 teams, each has players + leader |
| Pick game | Team leader | Must be their turn (current_pick_team) |
| Submit stats | Any player | Game must be active |
| Submit result | Referee | Game must be active |
| End game | Referee | Game must be active |
| Advance round | Referee | Game must be in titles status |

---

## Pick Alternation
- `current_pick_team` tracks whose turn it is
- After each pick, it flips to the other team
- First pick goes to the first team created (by created_at)

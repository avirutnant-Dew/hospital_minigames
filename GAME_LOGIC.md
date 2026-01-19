# Hospital Dash - Game Flow Logic

## 📋 Game Turn Sequence

### 1️⃣ **DICE ROLL PHASE** (Captain Rolls)
```
MainStage → CaptainStageView → DiceRoller
  ↓
Captain clicks "Roll Dice" button
  ↓
DiceRoller animates dice (1-6)
  ↓
onRoll() callback triggered with dice value
```

**Admin Control:**
- Admin can lock/unlock the dice via "สถานะลูกเต๋า" button
- Default: `is_dice_locked = true` (prevents rolling until admin unlocks)

---

### 2️⃣ **MOVEMENT PHASE** (Ambulance Moves)
```
DiceRoller onRoll(value) 
  ↓
Update team.current_tile = old_tile + dice_value
  ↓
GameBoard detects update (real-time via Supabase)
  ↓
AmbulanceToken animates movement to new tile
  ↓
GameTile displays tile type (start, grow, safe, care, bonus, challenge, finish)
```

**Database Update:**
```tsx
supabase.from("teams").update({
  current_tile: currentTile + diceValue
}).eq("id", teamId)
```

---

### 3️⃣ **TILE DETECTION & CHALLENGE ACTIVATION**
```
Landed on tile type:
  ├─ "grow" → GROW+ mini-game
  ├─ "safe" → SafeAct mini-game
  ├─ "care" → ProCare mini-game
  ├─ "challenge" → Random mini-game
  ├─ "bonus" → Auto add 5MB revenue
  └─ "finish" → Game over check

If tile = challenge/grow/safe/care:
  ↓
Set pending challenge in game_state:
  ├─ pending_challenge_team_id = current team
  ├─ pending_challenge_game_type = "growplus" | "safeact" | "procare"
  └─ pending_challenge_title = challenge name
```

**Database Update:**
```tsx
supabase.from("game_state").update({
  pending_challenge_team_id: teamId,
  pending_challenge_game_type: "growplus",
  pending_challenge_title: "GROW+ Challenge",
  is_dice_locked: false
}).eq("id", gameStateId)
```

---

### 4️⃣ **MINI-GAME PHASE** (Team Plays)
```
MainStage detects pending_challenge_game_type is set
  ↓
useEffect navigates to: /minigame/{type}?team={teamId}
  ↓
Mini-game page loads (GrowPlusPage, SafeActPage, etc.)
  ↓
Team plays selected mini-game:
  ├─ GROW+ (Revenue Tap, Referral Link, SBU Combo)
  ├─ SafeAct (Risk Defender, Critical Sync, Hazard Popper)
  └─ ProCare (Heart Collector, Empathy Echo, Smile Sparkle)
  ↓
Game controller manages:
  ├─ Timer countdown
  ├─ Score accumulation
  ├─ Real-time Supabase updates
  └─ Game completion detection
```

**During Mini-game:**
```tsx
// Mini-game page sets up listener
useEffect(() => {
  supabase.channel("growplus-mainstage")
    .on("postgres_changes", { table: "grow_plus_games" }, (payload) => {
      if (payload.new.is_active === false) {
        // Game ended
        handleGameEnd(payload.new.total_score)
      }
    })
    .subscribe()
}, [])
```

---

### 5️⃣ **SCORE UPDATE** (After Game Completion)
```
Mini-game completes when time runs out or game finishes
  ↓
Mini-game controller updates grow_plus_games:
  is_active = false
  total_score = final accumulated score
  ↓
MainStage listens via real-time subscription
  ↓
onGameEnd() clears pending challenge:
  ├─ pending_challenge_game_type = null
  ├─ pending_challenge_team_id = null
  └─ is_dice_locked = true (ready for next turn)
  ↓
Update team scores (revenue_score, safety_score, service_score)
  ↓
Team total scores now include mini-game rewards
```

**Database Updates:**
```tsx
// 1. Clear pending challenge
supabase.from("game_state").update({
  pending_challenge_game_type: null,
  pending_challenge_team_id: null,
  is_dice_locked: true
}).eq("id", gameStateId)

// 2. Update team revenue
supabase.from("teams").update({
  revenue_score: team.revenue_score + gameScore
}).eq("id", teamId)
```

---

### 6️⃣ **TURN TRANSITION** (Next Team)
```
Admin clicks "ถัดไป" (Next Turn) button
  ↓
nextTurn() function executes:
  ├─ Find current team index
  ├─ Calculate next team index (loop around)
  ├─ Set current_turn_team_id = nextTeam.id
  ├─ Set is_dice_locked = true (new captain can't roll until admin unlocks)
  ├─ Set is_challenge_active = false
  └─ Set last_dice_value = null
  ↓
News ticker announces: "ถึงตาของ [Team Name] แล้ว!"
  ↓
TurnIndicator updates to show new current team
  ↓
CaptainStageView displays new team's score
  ↓
New captain ready to roll
```

**Database Update:**
```tsx
supabase.from("game_state").update({
  current_turn_team_id: nextTeamId,
  is_dice_locked: true,
  is_challenge_active: false,
  last_dice_value: null
}).eq("id", gameStateId)
```

---

## 🔄 **Complete Game Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME START (Admin)                       │
│                   startGame() called                         │
│         current_turn_team_id = first team                   │
│              is_dice_locked = true                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   ADMIN UNLOCKS DICE           │
        │  toggleDiceLock()              │
        │  is_dice_locked = false        │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   CAPTAIN ROLLS DICE           │
        │   DiceRoller → onRoll(1-6)    │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   AMBULANCE MOVES              │
        │   current_tile += dice_value   │
        │   GameBoard animates token     │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   CHECK TILE TYPE              │
        │   • start → continue           │
        │   • bonus → +5MB auto          │
        │   • finish → check goal        │
        │   • challenge → mini-game ✓    │
        │   • grow/safe/care → mini-game │
        └────────────┬───────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │  SET PENDING CHALLENGE         │
        │  pending_challenge_game_type   │
        │  pending_challenge_team_id     │
        │  is_dice_locked = true         │
        └────────────┬──────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   NAVIGATE TO MINI-GAME PAGE   │
        │   /minigame/{type}?team={id}   │
        │   (Full page, not modal)       │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   TEAM PLAYS MINI-GAME         │
        │   • Timer runs                 │
        │   • Score accumulates          │
        │   • Real-time sync             │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   GAME COMPLETES               │
        │   is_active = false            │
        │   total_score = final          │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   RETURN TO MAIN STAGE         │
        │   Clear pending challenge      │
        │   Update team scores           │
        │   is_dice_locked = true        │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   ADMIN CLICKS NEXT TURN       │
        │   nextTurn() called            │
        │   current_turn_team_id = next  │
        │   is_dice_locked = true        │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   NEXT TEAM'S TURN BEGINS ◄────┼── Loop back to step 2
        │   TurnIndicator updates        │
        └────────────────────────────────┘
```

---

## 🎮 **Key State Variables**

### `game_state` Table
```typescript
{
  id: string;
  current_turn_team_id: string;        // Which team is playing now
  is_dice_locked: boolean;             // Can captain roll dice?
  is_challenge_active: boolean;        // Is challenge happening?
  last_dice_value: number;             // Last dice roll (1-6)
  pending_challenge_team_id: string;   // Team about to play mini-game
  pending_challenge_game_type: string; // "growplus" | "safeact" | "procare"
  pending_challenge_title: string;     // Display name
  challenge_type: string;              // "GROW_PLUS" | "SAFE_ACT" | "PRO_CARE"
  total_revenue: number;               // All teams' combined revenue (THB)
  target_revenue: number;              // Goal (default 1.15B THB)
}
```

### `teams` Table (Updated After Mini-game)
```typescript
{
  id: string;
  current_tile: number;        // Position on board (0-23)
  revenue_score: number;       // THB from Grow+ challenges
  safety_score: number;        // THB from SafeAct challenges
  service_score: number;       // THB from ProCare challenges
}
```

---

## 🛠️ **Admin Controls** (AdminDashboard.tsx)

| Control | Action | Effect |
|---------|--------|--------|
| **สถานะลูกเต๋า** | Lock/Unlock | Toggle `is_dice_locked` |
| **ถัดไป** | Next Turn | Cycle to next team, reset flags |
| **เริ่มเกม** | Start Game | Initialize game_state |
| **รีเซ็ต** | Reset | Clear all scores & tiles |
| **+10 MB / +50 MB** | Manual Score | Add revenue to specific team |

---

## ⚡ **Real-time Flow**

All updates sync via Supabase `postgres_changes`:

1. **MainStage** listens to `game_state` → navigates to mini-game when `pending_challenge_game_type` is set
2. **Mini-game pages** listen to `grow_plus_games`, `safe_act_games`, `pro_care_games` → detects when game ends
3. **GameBoard** listens to `teams` → animates token movement
4. **TurnIndicator** listens to `game_state` → shows current team
5. **ScoreBoard** listens to `teams` & `game_state` → shows progress

---

## 📊 **Score System**

| Source | Field | Currency | Conversion |
|--------|-------|----------|-----------|
| Grow+ Challenge | `revenue_score` | THB | Direct (e.g., 100k THB) |
| SafeAct Challenge | `safety_score` | THB | Direct |
| ProCare Challenge | `service_score` | THB | Direct |
| **Display** | n/a | MB | ÷ 1,000,000 |

Goal: **1,150 MB (1.15 Billion THB)**

---

## ✅ **Implementation Checklist**

- ✅ DiceRoller component (animation + onRoll callback)
- ✅ MainStage auto-navigation to mini-games
- ✅ Mini-game pages with back button
- ✅ Score sync after game completion
- ✅ Turn sequence (next team auto-lock dice)
- ✅ Real-time updates via Supabase channels
- ✅ Admin controls (lock/unlock, next turn, manual scores)
- ✅ Board tile movement animation
- ✅ News ticker announcements

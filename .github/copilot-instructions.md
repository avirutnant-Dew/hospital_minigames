# Copilot Instructions for Hospital Dash

## Project Overview
Hospital Dash is a gamified interactive experience built with React, TypeScript, and Vite. It features a hospital-themed board game with multiple mini-games (Grow+, SafeAct, ProCare) and real-time multiplayer team competitions centered around hospital revenue, safety, and service metrics.

## Architecture & Data Flow

### Core Tech Stack
- **Frontend**: React 18 + TypeScript with Vite
- **Styling**: Tailwind CSS + shadcn/ui (prebuilt Radix UI components)
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **UI Library**: shadcn/ui components in `src/components/ui/`
- **Routing**: React Router
- **State Management**: React Query for data fetching, Supabase real-time listeners for live updates
- **Icons**: Lucide React

### Database Core Tables
- **teams**: Team data with id, name, color, current_tile, revenue_score, safety_score, service_score
- **game_state**: Single row tracking current_turn_team_id, is_dice_locked, pending challenges, target/total revenue
- **challenge_questions**: Questions by strategy_type (grow, safe, care)
- **emoji_reactions**: Live emoji reactions from players
- Real-time subscriptions via `supabase.channel()` keep UI in sync with database changes

### Key Pages (src/pages/)
- **MainStage.tsx**: Main game board orchestrator - manages game flow, dice rolls, challenge routing
- **PlayerView.tsx**: Team player display view
- **AdminDashboard.tsx**: Admin controls for game state and team management
- **AdminDatabase.tsx**: Direct database admin interface

### Component Architecture

**Game Components** (`src/components/game/`):
- `GameBoard.tsx`: 24-tile board grid with team tokens; reads teams from DB and listens for updates
- `ScoreBoard.tsx`: Displays revenue progress toward target (default 1.15B THB), safety/service scores
- `TurnIndicator.tsx`: Shows current turn team from game_state.current_turn_team_id
- `DiceRoller.tsx`: Handles dice roll logic with is_dice_locked state
- `AmbulanceToken.tsx`: Visual team token representation
- `GameTile.tsx`: Individual board tile (type: start, grow, safe, care, bonus, challenge, finish)
- Mini-game sub-directories: `growplus/`, `safeact/`, `procare/` contain sub-game UI

**UI Components** (`src/components/ui/`):
All shadcn/ui components - import directly when needed (Dialog, Button, Card, etc.)

### Real-time Data Sync Pattern
Components typically follow this pattern:
```tsx
const [data, setData] = useState<Type[]>([]);

useEffect(() => {
  const fetch = async () => {
    const { data } = await supabase.from("table").select("*");
    setData(data);
  };
  fetch();

  const channel = supabase
    .channel("room-name")
    .on("postgres_changes", { event: "*", schema: "public", table: "table_name" }, () => fetch())
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

## Build & Development Workflows

### Commands
- `npm run dev`: Start Vite dev server on `localhost:8080` with HMR
- `npm run build`: Production build to `dist/`
- `npm run build:dev`: Development build with componentTagger plugin (Lovable integration)
- `npm run lint`: Run ESLint (no-unused-vars disabled)
- `npm run preview`: Preview production build locally

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase public key
- Set in `.env.local` (not committed to repo)

### Path Aliases
- `@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)
- Import consistently: `import { GameBoard } from "@/components/game/GameBoard"`

## Code Patterns & Conventions

### Component Structure
- Functional components with React hooks
- Types defined inline or imported from supabase/types.ts
- CSS classes use Tailwind utility classes; no inline styles
- Glass-morphism style: `className="glass-card p-6"` for card containers

### Tailwind & Fonts
- **Display Font**: Orbitron (for headings/titles)
- **Body Font**: Kanit (for main content)
- **Color Scheme**: CSS variables in theme (primary, secondary, accent, etc.)
- **Custom Classes**: Check tailwind.config.ts for team colors (team-alpha, team-beta, etc.) and gradients

### Supabase Client Import
Always import from the centralized client:
```tsx
import { supabase } from "@/integrations/supabase/client";
```
Types are auto-generated in `src/integrations/supabase/types.ts` - do not edit manually.

### Utility Functions
- `cn()` in `src/lib/utils.ts`: Merge Tailwind classes safely (clsx + twMerge)
- `formatRevenueMB()`: Convert THB to millions for display (see ScoreBoard.tsx for examples)
- Locale: Thai number formatting in ScoreBoard (`th-TH`)

### Mini-game Challenge Flow
When a team lands on a challenge tile:
1. MainStage.tsx detects `pending_challenge_game_type` in game_state
2. Navigates to `/minigame/{type}?team={id}` (e.g., `/minigame/growplus`)
3. Mini-game component updates team scores via supabase.from("teams").update()
4. Admin clears pending challenge to continue main game flow

### Revenue/Score System
- **Revenue Score (THB)**: Primary metric, counted toward hospital goal
- **Safety Score**: Points from SafeAct challenges (optional conversion to THB in ScoreBoard)
- **Service Score**: Points from ProCare challenges (optional conversion to THB in ScoreBoard)
- Conversion rates customizable in ScoreBoard.tsx constants

## Common Development Tasks

### Adding a New Mini-game
1. Create page in `src/pages/minigame/{name}Page.tsx`
2. Add route in App.tsx
3. Create UI components in `src/components/game/{name}/`
4. Update team scores via `supabase.from("teams").update({ revenue_score })`
5. Clear pending challenge via `supabase.from("game_state").update({ pending_challenge_game_type: null })`

### Adding UI Component
1. Use existing shadcn/ui components from `src/components/ui/`
2. Or generate new one from shadcn/ui CLI: `npx shadcn-ui@latest add [component]`
3. Wrap in `glass-card` classes for consistency with existing design

### Updating Database Schema
1. Create migration in `supabase/migrations/` (auto-timestamped)
2. Update `src/integrations/supabase/types.ts` by running supabase CLI locally
3. Deploy migrations to production

### Debugging Real-time Issues
- Check browser DevTools > Console for Supabase errors
- Verify channel subscription: `supabase.channel()` should have active listeners
- Common issue: forgetting cleanup in useEffect return (always removeChannel)

## Key Files & Where Things Live
- **Game logic**: `src/pages/MainStage.tsx`, `src/components/game/GameBoard.tsx`
- **Scoring**: `src/components/game/ScoreBoard.tsx`
- **Database types**: `src/integrations/supabase/types.ts` (auto-generated)
- **Supabase client**: `src/integrations/supabase/client.ts` (auto-generated)
- **Tailwind config**: `tailwind.config.ts` (colors, fonts, custom utilities)
- **Routes**: `src/App.tsx`

## Notes for AI Agents
- This is a Lovable-generated project (see README.md) - component-level changes are safe
- ESLint has `no-unused-vars` disabled globally (intentional for flexibility)
- Thai language content throughout - preserve language consistency when editing text
- Real-time sync is critical - always include Supabase channel listeners in data-fetching components
- Test changes with `npm run dev` before submitting - HMR should work seamlessly

import { Trophy, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  color: string;
  current_tile: number;
  revenue_score: number;
  safety_score: number;
  service_score: number;
}

interface GameState {
  id: string;
  current_turn_team_id: string | null;
  is_dice_locked: boolean;
  is_challenge_active: boolean;
}

interface Props {
  currentTeam: Team | null;
  gameState: GameState | null;
  allTeams: Team[];
  variant?: "full" | "panel";
}

const toMB = (baht: number) => baht / 1_000_000;

export function CaptainStageView({ currentTeam, gameState, allTeams, variant = "full" }: Props) {
  if (!currentTeam || !gameState) return null;

  const revenueMB = toMB(currentTeam.revenue_score);
  const safeProMB = toMB(currentTeam.safety_score + currentTeam.service_score);

  return (
    <div className={cn("glass-card", variant === "panel" ? "p-6 text-center" : "p-10 space-y-6")}>
      <div className="flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: currentTeam.color }} />
        <h2 className="text-xl font-display font-bold">{currentTeam.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="glass-card p-4">
          <MapPin className="w-6 h-6 mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-1">ตำแหน่ง</p>
          <p className="text-lg font-bold">{currentTeam.current_tile}</p>
        </div>

        <div className="glass-card p-4">
          <Trophy className="w-6 h-6 mx-auto text-yellow-400" />
          <p className="text-sm text-muted-foreground mt-1">Revenue</p>
          <p className="text-lg font-bold">{revenueMB.toFixed(1)} MB</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">คะแนนรวม (Safe + Pro)</p>
        <p className="text-2xl font-display font-bold text-accent">{safeProMB.toFixed(1)} MB</p>
      </div>
    </div>
  );
}

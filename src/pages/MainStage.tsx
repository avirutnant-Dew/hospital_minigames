import { useEffect, useState, useCallback } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { EmojiReactions } from "@/components/game/EmojiReactions";
import { NewsTicker } from "@/components/game/NewsTicker";
import { CaptainStageView } from "@/components/game/CaptainStageView";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  pending_challenge_team_id: string | null;
  pending_challenge_game_type: string | null;
  is_dice_locked: boolean;
  is_challenge_active: boolean;
}

export default function MainStage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  const navigate = useNavigate();

  /** โหลดข้อมูลเริ่มต้น */
  const refreshAll = useCallback(async () => {
    const [{ data: gs }, { data: t }] = await Promise.all([
      supabase.from("game_state").select("*").limit(1).maybeSingle(),
      supabase.from("teams").select("*").order("name"),
    ]);

    if (gs) setGameState(gs as GameState);
    if (t) setTeams(t as Team[]);
  }, []);

  /** เด้งไปหน้า MiniGame ถ้ามี challenge_active */
  useEffect(() => {
    if (!gameState) return;

    // Case 1: Pending Challenge (Wait from Player)
    if (gameState.pending_challenge_game_type && gameState.pending_challenge_team_id) {
      const type = gameState.pending_challenge_game_type;
      const team = gameState.pending_challenge_team_id;

      // Map specific game types to their category routes
      let route = "growplus";
      if (['REVENUE_TAP', 'REFERRAL_LINK', 'SBU_COMBO', 'HOSPITAL_NETWORK', 'DEPARTMENT_EFFICIENCY'].includes(type)) {
        route = "growplus";
      } else if (['RISK_DEFENDER', 'CRITICAL_SYNC', 'HAZARD_POPPER'].includes(type)) {
        route = "safeact";
      } else if (['HEART_COLLECTOR', 'EMPATHY_ECHO', 'SMILE_SPARKLE'].includes(type)) {
        route = "procare";
      } else if (type === 'challenge') {
        route = "challenge";
      }

      navigate(`/minigame/${route}?team=${team}`);
      return;
    }

    // Case 2: Active Challenge (Admin Started) - Need to find which game is active
    if (gameState.is_challenge_active && gameState.current_turn_team_id) {
      const checkActiveGame = async () => {
        const teamId = gameState.current_turn_team_id;
        // Check which game table has active game for this team
        const [grow, safe, pro] = await Promise.all([
          supabase.from("grow_plus_games").select("game_type").eq("team_id", teamId).eq("is_active", true).maybeSingle(),
          supabase.from("safe_act_games").select("game_type").eq("team_id", teamId).eq("is_active", true).maybeSingle(),
          supabase.from("pro_care_games").select("game_type").eq("team_id", teamId).eq("is_active", true).maybeSingle(),
        ]);

        let activeType = null;
        let route = "growplus"; // default

        if (grow.data) { activeType = grow.data.game_type; route = "growplus"; }
        else if (safe.data) { activeType = safe.data.game_type; route = "safeact"; }
        else if (pro.data) { activeType = pro.data.game_type; route = "procare"; }

        if (activeType) {
          navigate(`/minigame/${route}?team=${teamId}&game=${activeType}`);
        }
      };
      checkActiveGame();
    }
  }, [gameState, navigate]);

  /** Realtime Listener */
  useEffect(() => {
    refreshAll();

    const channel = supabase
      .channel("mainstage")
      .on("postgres_changes", { event: "*", table: "game_state", schema: "public" }, (p) => {
        setGameState(p.new as GameState);
      })
      .on("postgres_changes", { event: "*", table: "teams", schema: "public" }, (p) => {
        refreshAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /** set current team */
  useEffect(() => {
    if (gameState?.current_turn_team_id) {
      const t = teams.find((x) => x.id === gameState.current_turn_team_id);
      setCurrentTeam(t || null);
    } else {
      setCurrentTeam(null);
    }
  }, [gameState, teams]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto py-4 flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-display font-bold">Hospital Game of Life</h1>
            <p className="text-xs text-muted-foreground">Main Stage</p>
          </div>
        </div>
        <div className="neon-line" />
      </header>

      <main className="container mx-auto py-4 md:py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <GameBoard />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <ScoreBoard />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-700 delay-300">
            <TurnIndicator />
            {currentTeam ? (
              <CaptainStageView currentTeam={currentTeam} gameState={gameState} allTeams={teams} variant="panel" />
            ) : (
              <div className="glass-card p-12 text-center text-muted-foreground animate-pulse">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg">รอทีมถัดไป…</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <NewsTicker />
      <EmojiReactions showButtons={false} />
    </div>
  );
}

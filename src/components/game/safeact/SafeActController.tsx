import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SafeActGame, SafeActGameType, SAFE_ACT_CONFIG, selectRandomSafeActGame, Hazard } from "./types";

import { RiskDefenderGame, RiskDefenderMainDisplay } from "./RiskDefenderGame";
import { CriticalSyncGame, CriticalSyncMainDisplay } from "./CriticalSyncGame";
import { HazardPopperGame, HazardPopperMainDisplay } from "./HazardPopperGame";

import { SafeActSummaryModal } from "./SafeActSummaryModal";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

/* ================= PROPS ================= */

interface SafeActControllerProps {
  teamId?: string;
  playerNickname?: string;
  isMainStage?: boolean;
  initialGame?: SafeActGame | null;
  onGameEnd?: (finalScore: number) => void;
  forcedGameType?: SafeActGameType;
}

/* ================= CONTROLLER ================= */

export function SafeActController({
  teamId,
  playerNickname,
  isMainStage = false,
  initialGame,
  onGameEnd,
  forcedGameType,
}: SafeActControllerProps) {
  const [activeGame, setActiveGame] = useState<SafeActGame | null>(initialGame || null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [shieldHealth, setShieldHealth] = useState(100);

  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [hazardsCleared, setHazardsCleared] = useState(0);
  const [hazards, setHazards] = useState<Hazard[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const isStarting = useRef(false);

  // Critical Sync specific state
  const [ekgValue, setEkgValue] = useState(50);
  const [secondsOutsideZone, setSecondsOutsideZone] = useState(0);
  const [isInSafeZone, setIsInSafeZone] = useState(true);

  /* ================= INIT ================= */

  useEffect(() => {
    if (!initialGame) return;

    setActiveGame(initialGame);
    setShieldHealth(initialGame.shield_health ?? 100);
    setTotalCorrect(initialGame.total_correct ?? 0);
    setTotalWrong(initialGame.total_wrong ?? 0);
    setHazardsCleared(initialGame.hazards_cleared ?? 0);

    const remain = Math.max(0, Math.floor((new Date(initialGame.ends_at).getTime() - Date.now()) / 1000));
    setTimeRemaining(remain);
  }, [initialGame?.id]);

  /* ================= REALTIME ================= */

  useEffect(() => {
    const channel = supabase
      .channel("safe-act-main")
      .on("postgres_changes", { event: "*", schema: "public", table: "safe_act_games" }, (payload) => {
        const game = payload.new as SafeActGame;
        if (teamId && game.team_id !== teamId) return;

        if (game.is_active) {
          setActiveGame(game);
          const remain = Math.max(0, Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000));
          setTimeRemaining(remain);
        } else if (activeGame?.id === game.id) {
          setActiveGame(null);
          setShowSummary(true);
          onGameEnd?.(game.safety_score ?? 0);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGame?.id, teamId, onGameEnd]);

  /* ================= END GAME ================= */

  const endGame = useCallback(async () => {
    if (!activeGame) return;

    let safetyScore = 0;

    if (activeGame.game_type === "RISK_DEFENDER") {
      safetyScore =
        totalCorrect * SAFE_ACT_CONFIG.RISK_DEFENDER.correctScore -
        totalWrong * SAFE_ACT_CONFIG.RISK_DEFENDER.wrongPenalty;
    }

    if (activeGame.game_type === "HAZARD_POPPER") {
      safetyScore = hazardsCleared * SAFE_ACT_CONFIG.HAZARD_POPPER.scorePerHazard;
    }

    await supabase
      .from("safe_act_games")
      .update({
        is_active: false,
        shield_health: shieldHealth,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        hazards_cleared: hazardsCleared,
        safety_score: Math.max(0, safetyScore),
      })
      .eq("id", activeGame.id);

    if (teamId && safetyScore > 0) {
      const { data } = await supabase.from("teams").select("safety_score").eq("id", teamId).single();

      await supabase
        .from("teams")
        .update({
          safety_score: (data?.safety_score || 0) + safetyScore,
        })
        .eq("id", teamId);
    }

    onGameEnd?.(safetyScore);
  }, [activeGame, shieldHealth, totalCorrect, totalWrong, hazardsCleared, teamId, onGameEnd]);

  const handleCriticalSyncTap = useCallback(() => {
    if (!activeGame || activeGame.game_type !== "CRITICAL_SYNC") return;

    setEkgValue(prev => {
      const { safeZoneMin, safeZoneMax } = SAFE_ACT_CONFIG.CRITICAL_SYNC;
      const center = (safeZoneMin + safeZoneMax) / 2;

      // Pull towards center
      const pull = (center - prev) * 0.2;
      return Math.max(0, Math.min(100, prev + pull + (Math.random() - 0.5) * 5));
    });

    setTotalCorrect(c => c + 1);
  }, [activeGame]);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!activeGame) return;

    // Initialize timeRemaining if not already set
    if (timeRemaining === 0) {
      const remain = Math.max(0, Math.floor((new Date(activeGame.ends_at).getTime() - Date.now()) / 1000));
      setTimeRemaining(remain);
      return;
    }

    if (timeRemaining <= 0) {
      endGame();
      return;
    }

    const t = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [activeGame, endGame, timeRemaining]);

  /* ================= INITIAL FETCH ================= */
  useEffect(() => {
    if (initialGame) {
      setActiveGame(initialGame);
      setShieldHealth(initialGame.shield_health ?? 100);
      setTotalCorrect(initialGame.total_correct ?? 0);
      setTotalWrong(initialGame.total_wrong ?? 0);
      setHazardsCleared(initialGame.hazards_cleared ?? 0);
      const remain = Math.max(0, Math.floor((new Date(initialGame.ends_at).getTime() - Date.now()) / 1000));
      setTimeRemaining(remain);
      return;
    }

    const fetchCurrentGame = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("safe_act_games")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (teamId) {
          query = query.eq("team_id", teamId);
        } else {
          query = query.is("team_id", null);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          const game = data[0] as SafeActGame;
          setActiveGame(game);
          const remain = Math.max(0, Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000));
          setTimeRemaining(remain);
        }
      } catch (err) {
        console.error("Error fetching current safe act game:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentGame();
  }, [teamId, initialGame]);

  /* ================= START GAME ================= */

  const startGame = useCallback(
    async (type?: SafeActGameType) => {
      if (isStarting.current) return;
      isStarting.current = true;
      setIsLoading(true);

      try {
        const gameType = type || selectRandomSafeActGame();
        const duration = SAFE_ACT_CONFIG[gameType].duration;
        const endsAt = new Date(Date.now() + duration * 1000).toISOString();

        const { data, error } = await supabase.from("safe_act_games").insert({
          team_id: teamId ?? null,
          game_type: gameType,
          ends_at: endsAt,
          is_active: true,
          shield_health: 100,
          total_correct: 0,
          total_wrong: 0,
          hazards_cleared: 0,
        }).select().single();

        if (error) {
          console.error("Failed to start game:", error);
          return;
        }

        const game = data as SafeActGame;
        setActiveGame(game);
        setShieldHealth(100);
        setTotalCorrect(0);
        setTotalWrong(0);
        setHazardsCleared(0);
        setHazards([]);
        const remain = Math.max(0, Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000));
        setTimeRemaining(remain);
      } catch (err) {
        console.error("Unhandled error in startGame:", err);
      } finally {
        setIsLoading(false);
        isStarting.current = false;
      }
    },
    [teamId],
  );

  /* ================= AUTO START ================= */
  // Auto-start game if forcedGameType is provided (Test Mode)
  useEffect(() => {
    if (!forcedGameType || isLoading) return;

    const needsStart = !activeGame || activeGame.game_type !== forcedGameType;

    if (needsStart) {
      startGame(forcedGameType);
    }
  }, [forcedGameType, activeGame?.game_type, isLoading, startGame]);

  /* ================= CRITICAL SYNC LOGIC ================= */
  useEffect(() => {
    if (!activeGame || activeGame.game_type !== "CRITICAL_SYNC" || !isMainStage) return;

    const { safeZoneMin, safeZoneMax } = SAFE_ACT_CONFIG.CRITICAL_SYNC;

    const interval = setInterval(() => {
      setEkgValue((prev) => {
        // Naturally drift
        const drift = (Math.random() - 0.5) * 4;
        const newValue = Math.max(0, Math.min(100, prev + drift));

        const inZone = newValue >= safeZoneMin && newValue <= safeZoneMax;
        setIsInSafeZone(inZone);

        if (!inZone) {
          setSecondsOutsideZone(s => s + 1);
        } else {
          setSecondsOutsideZone(0);
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGame?.id, isMainStage]);

  /* ================= PLAYER VIEW ================= */

  if (!isMainStage) {
    if (!activeGame) {
      return (
        <div className="glass-card p-8 text-center space-y-4">
          {isLoading ? (
            <>
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <p>กําลังเริ่มเกม...</p>
            </>
          ) : (
            <>
              <Shield className="w-16 h-16 mx-auto animate-pulse" />
              <p>รอ Admin เริ่ม SAFE ACT</p>
            </>
          )}
        </div>
      );
    }

    return (
      <>
        {activeGame.game_type === "RISK_DEFENDER" && (
          <RiskDefenderGame
            shieldHealth={shieldHealth}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
            onSwipe={(correct) => (correct ? setTotalCorrect((c) => c + 1) : setTotalWrong((w) => w + 1))}
          />
        )}

        {activeGame.game_type === "HAZARD_POPPER" && (
          <HazardPopperGame
            hazards={hazards}
            hazardsCleared={hazardsCleared}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
            onTapHazard={() => setHazardsCleared((c) => c + 1)}
          />
        )}

        {activeGame.game_type === "CRITICAL_SYNC" && (
          <CriticalSyncGame
            ekgValue={ekgValue}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
            isInSafeZone={isInSafeZone}
            onTap={handleCriticalSyncTap}
          />
        )}

        <SafeActSummaryModal
          open={showSummary}
          onOpenChange={setShowSummary}
          shieldHealth={shieldHealth}
          totalCorrect={totalCorrect}
          totalWrong={totalWrong}
          hazardsCleared={hazardsCleared}
          gameType={activeGame.game_type}
        />
      </>
    );
  }

  /* ================= MAIN STAGE ================= */

  return (
    <div className="space-y-6">
      {!activeGame ? (
        <div className="glass-card p-8 text-center space-y-6">
          <Shield className="w-20 h-20 mx-auto animate-pulse" />
          <h2 className="text-3xl font-bold">SAFE ACT Mini Games</h2>

          <div className="grid grid-cols-3 gap-4">
            <Button onClick={() => startGame("RISK_DEFENDER")}>Risk Defender</Button>
            <Button onClick={() => startGame("CRITICAL_SYNC")}>Critical Sync</Button>
            <Button onClick={() => startGame("HAZARD_POPPER")}>Hazard Popper</Button>
          </div>

          <Button className="w-full" onClick={() => startGame()} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "🎲 Random Game"}
          </Button>
        </div>
      ) : (
        <>
          {activeGame.game_type === "RISK_DEFENDER" && (
            <RiskDefenderMainDisplay
              shieldHealth={shieldHealth}
              timeRemaining={timeRemaining}
              totalCorrect={totalCorrect}
              totalWrong={totalWrong}
            />
          )}

          {activeGame.game_type === "HAZARD_POPPER" && (
            <HazardPopperMainDisplay
              hazards={hazards}
              hazardsCleared={hazardsCleared}
              timeRemaining={timeRemaining}
              totalHazards={SAFE_ACT_CONFIG.HAZARD_POPPER.maxHazards}
              isComplete={false}
            />
          )}

          {activeGame.game_type === "CRITICAL_SYNC" && (
            <CriticalSyncMainDisplay
              ekgValue={ekgValue}
              timeRemaining={timeRemaining}
              isInSafeZone={isInSafeZone}
              secondsOutsideZone={secondsOutsideZone}
              totalScore={totalCorrect * 100000} // Simple score for now
            />
          )}
        </>
      )}
    </div>
  );
}

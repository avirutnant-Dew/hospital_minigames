import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

import { GrowPlusGame, GrowPlusGameType, GrowPlusScore, GAME_CONFIG, selectRandomGame } from "./types";

import { RevenueTapGame, RevenueTapMainDisplay } from "./RevenueTapGame";
import { ReferralLinkMainDisplay } from "./ReferralLinkGame";
import { SBUComboMainDisplay } from "./SBUComboGame";
import { HospitalNetworkChain } from "./HospitalNetworkChain";
import { DepartmentEfficiencyChain } from "./DepartmentEfficiencyChain";
import { GameSummaryModal } from "./GameSummaryModal";
import { useBatchActionBuffer } from "@/hooks/useBatchActionBuffer";

interface Props {
  teamId?: string;
  playerNickname?: string; // For multi-player support
  isMainStage?: boolean;
  initialGame?: GrowPlusGame | null;
  onGameEnd?: (score: number) => void;
  enableBatchUpdates?: boolean; // Default: true for mobile, false for admin view
  forcedGameType?: GrowPlusGameType; // Force a specific game type (for testing)
}

export function GrowPlusController({
  teamId,
  playerNickname,
  isMainStage = false,
  initialGame,
  onGameEnd,
  enableBatchUpdates = true,
  forcedGameType,
}: Props) {
  const [activeGame, setActiveGame] = useState<GrowPlusGame | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [recentScores, setRecentScores] = useState<GrowPlusScore[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const isStarting = useRef(false);

  // Batch action buffer for multi-player support
  const { addAction, forceFlush } = useBatchActionBuffer({
    gameId: activeGame?.id,
    gameType: 'grow_plus',
    playerNickname: playerNickname || 'Unknown',
    teamId,
    batchSize: 5,
    flushIntervalMs: 2000,
    enabled: enableBatchUpdates && !!playerNickname,
  });

  /* ---------- INITIAL FETCH ---------- */
  useEffect(() => {
    if (initialGame) return;

    const fetchCurrentGame = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("grow_plus_games")
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
          const game = data[0] as GrowPlusGame;
          setActiveGame(game);
          const remain = Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000);
          setTimeRemaining(Math.max(0, remain));
        }
      } catch (err) {
        console.error("Error fetching current game:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentGame();
  }, [teamId, initialGame]);

  /* ---------- SET GAME ACTIVE ON LOAD ---------- */
  useEffect(() => {
    if (activeGame && activeGame.is_active) {
      setGameActive(true);
    }
  }, [activeGame?.id, activeGame?.is_active]);

  /* ---------- REALTIME GAME STATE ---------- */
  useEffect(() => {
    const channel = supabase
      .channel("growplus-mainstage")
      .on("postgres_changes", { event: "*", schema: "public", table: "grow_plus_games" }, (payload) => {
        const game = payload.new as GrowPlusGame;
        if (teamId && game.team_id !== teamId) return;

        if (game.is_active) {
          setActiveGame(game);
          setTotalScore(game.total_score || 0);
          setGameActive(true);
        } else {
          // ✅ GAME ENDED
          setActiveGame(null);
          setGameActive(false);
          setShowSummary(true);
          onGameEnd?.(game.total_score || 0);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, onGameEnd]);

  /* ---------- REALTIME BATCH SCORE UPDATES ---------- */
  useEffect(() => {
    if (!activeGame) return;

    const channel = supabase
      .channel(`grow-plus-scores-${activeGame.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grow_plus_scores',
          filter: `game_id=eq.${activeGame.id}`,
        },
        (payload) => {
          const newScore = payload.new as GrowPlusScore;
          // Update total score from batch insert
          setTotalScore((prev) => prev + newScore.score_value);
          // Track recent scores for leaderboard
          setRecentScores((prev) => [newScore, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGame?.id]);

  /* ---------- COUNT ACTIVE PLAYERS ---------- */
  useEffect(() => {
    if (!activeGame || !teamId) return;

    const fetchPlayerCount = async () => {
      const { data } = await supabase
        .from('grow_plus_scores')
        .select('player_nickname', { count: 'exact' })
        .eq('game_id', activeGame.id)
        .then((result) => ({
          data: result.data ? [...new Set(result.data.map(s => s.player_nickname))].length : 0
        }));

      setPlayerCount(data || 0);
    };

    fetchPlayerCount();
    const interval = setInterval(fetchPlayerCount, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [activeGame?.id, teamId]);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (!activeGame) return;

    // Initialize timeRemaining if not already set
    if (timeRemaining === 0) {
      const remain = Math.floor((new Date(activeGame.ends_at).getTime() - Date.now()) / 1000) || 0;
      setTimeRemaining(Math.max(0, remain));
      return;
    }

    if (timeRemaining <= 0) {
      endGame();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame]);

  /* ---------- START GAME ---------- */
  const startGame = useCallback(
    async (type?: GrowPlusGameType) => {
      if (isStarting.current) return;
      isStarting.current = true;
      setLoading(true);

      try {
        const gameType = type || selectRandomGame();
        const duration = GAME_CONFIG[gameType].duration;
        const endsAt = new Date(Date.now() + duration * 1000).toISOString();

        const { data, error } = await supabase.from("grow_plus_games").insert({
          team_id: teamId || null,
          game_type: gameType,
          is_active: true,
          ends_at: endsAt,
          total_score: 0,
          combo_multiplier: 1,
        }).select().single();

        if (error) {
          console.error('Failed to create game:', error);
          return;
        }

        const game = data as GrowPlusGame;
        setActiveGame(game);
        setTotalScore(0);
        setTimeRemaining(duration);
        setGameActive(true);
      } catch (err) {
        console.error('Unhandled error in startGame:', err);
      } finally {
        setLoading(false);
        isStarting.current = false;
      }
    },
    [teamId],
  );

  // Auto-start game if forcedGameType is provided (Test Mode)
  useEffect(() => {
    if (!forcedGameType || loading) return;

    // Start if no game active OR if the active game is the wrong type
    const needsStart = !activeGame || activeGame.game_type !== forcedGameType;

    if (needsStart) {
      console.log(`Test Mode: ${activeGame ? 'Switching' : 'Starting'} game to:`, forcedGameType);
      startGame(forcedGameType);
    }
  }, [forcedGameType, activeGame?.game_type, loading, startGame]);

  /* ---------- END GAME ---------- */
  const endGame = useCallback(async () => {
    if (!activeGame) return;

    // Force flush any remaining buffered actions before ending game
    if (enableBatchUpdates) {
      forceFlush();
    }

    setGameActive(false);
    await supabase.from("grow_plus_games").update({ is_active: false }).eq("id", activeGame.id);
  }, [activeGame, enableBatchUpdates, forceFlush]);

  /* ---------- HANDLE TAP (Revenue Tap Game) ---------- */
  const handleTap = useCallback(async () => {
    if (!activeGame || activeGame.game_type !== "REVENUE_TAP") return;

    const scorePerTap = GAME_CONFIG.REVENUE_TAP.scorePerAction;

    if (enableBatchUpdates && playerNickname) {
      // Multi-player mode: use batch buffering
      addAction('TAP', scorePerTap);
      // Optimistic UI update
      setTotalScore((prev) => prev + scorePerTap);
    } else {
      // Single-player/admin mode: direct database update
      const newScore = totalScore + scorePerTap;
      setTotalScore(newScore);

      try {
        await supabase
          .from("grow_plus_games")
          .update({ total_score: newScore })
          .eq("id", activeGame.id);
      } catch (err) {
        console.error("Failed to update score:", err);
      }
    }
  }, [activeGame, totalScore, enableBatchUpdates, playerNickname, addAction]);

  /* ---------- RENDER (MAIN STAGE) ---------- */
  if (isMainStage) {
    if (!activeGame) {
      return (
        <div className="glass-card p-8 text-center space-y-6">
          <Sparkles className="w-20 h-20 mx-auto text-strategy-grow animate-pulse" />
          <h2 className="text-3xl font-display font-bold text-gradient">GROW+ Mini Games</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <Button onClick={() => startGame("REVENUE_TAP")} size="lg">
              💰 Revenue Tap
            </Button>
            <Button onClick={() => startGame("HOSPITAL_NETWORK")} size="lg">
              🏥 Hospital Network
            </Button>
            <Button onClick={() => startGame("DEPARTMENT_EFFICIENCY")} size="lg">
              🚑 Department Efficiency
            </Button>
          </div>

          <Button size="lg" className="w-full" disabled={loading} onClick={() => startGame()}>
            {loading ? <Loader2 className="animate-spin" /> : "🎲 Random Game"}
          </Button>
        </div>
      );
    }

    return (
      <>
        {activeGame.game_type === "REVENUE_TAP" && (
          <RevenueTapGame
            onTap={handleTap}
            totalScore={totalScore}
            timeRemaining={timeRemaining}
            isActive={gameActive}
            gameId={activeGame.id}
            playerNickname={playerNickname}
            playerCount={playerCount}
          />
        )}
        {activeGame.game_type === "HOSPITAL_NETWORK" && (
          <HospitalNetworkChain
            gameId={activeGame.id}
            teamId={teamId}
            playerNickname={playerNickname || 'Unknown'}
            onScore={(score) => {
              setTotalScore((prev) => prev + score);
              if (enableBatchUpdates && playerNickname) {
                addAction('SEQUENCE_COMPLETE', score);
              }
            }}
            durationSeconds={timeRemaining}
            playerCount={playerCount}
          />
        )}
        {activeGame.game_type === "DEPARTMENT_EFFICIENCY" && (
          <DepartmentEfficiencyChain
            gameId={activeGame.id}
            teamId={teamId}
            playerNickname={playerNickname || 'Unknown'}
            onScore={(score) => {
              setTotalScore((prev) => prev + score);
              if (enableBatchUpdates && playerNickname) {
                addAction('PATHWAY_COMPLETE', score);
              }
            }}
            durationSeconds={timeRemaining}
            playerCount={playerCount}
          />
        )}
        {activeGame.game_type === "REFERRAL_LINK" && (
          <ReferralLinkMainDisplay totalScore={totalScore} timeRemaining={timeRemaining} recentLinks={[]} />
        )}
        {activeGame.game_type === "SBU_COMBO" && (
          <SBUComboMainDisplay
            totalScore={totalScore}
            timeRemaining={timeRemaining}
            currentZone="Heart"
            targetZone="Heart"
            syncCount={0}
            comboActive={false}
          />
        )}

        <GameSummaryModal
          open={showSummary}
          onOpenChange={setShowSummary}
          totalRevenue={totalScore}
          gameType={activeGame.game_type}
        />
      </>
    );
  }

  // ======================
  // PLAYER VIEW
  // ======================
  if (!activeGame) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        {loading ? (
          <>
            <Loader2 className="mx-auto w-12 h-12 text-strategy-grow animate-spin" />
            <p>กําลังเริ่มเกม...</p>
          </>
        ) : (
          <>
            <Sparkles className="mx-auto w-12 h-12 text-strategy-grow" />
            <p>รอ Admin เริ่ม GROW+</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {activeGame.game_type === "REVENUE_TAP" && (
        <RevenueTapGame
          onTap={handleTap}
          totalScore={totalScore}
          timeRemaining={timeRemaining}
          isActive={gameActive}
          gameId={activeGame.id}
          playerNickname={playerNickname}
          playerCount={playerCount}
        />
      )}
      {activeGame.game_type === "HOSPITAL_NETWORK" && (
        <div className="w-full h-[600px]">
          <HospitalNetworkChain
            gameId={activeGame.id}
            teamId={teamId || null}
            playerNickname={playerNickname || 'Unknown'}
            onScore={(score, playerName) => {
              setTotalScore((prev) => prev + score);
              if (enableBatchUpdates && playerNickname) {
                addAction('SEQUENCE_COMPLETE', score);
              }
            }}
            durationSeconds={timeRemaining}
            playerCount={playerCount}
          />
        </div>
      )}
      {activeGame.game_type === "DEPARTMENT_EFFICIENCY" && (
        <div className="w-full h-[600px]">
          <DepartmentEfficiencyChain
            gameId={activeGame.id}
            teamId={teamId || null}
            playerNickname={playerNickname || 'Unknown'}
            onScore={(score, playerName) => {
              setTotalScore((prev) => prev + score);
              if (enableBatchUpdates && playerNickname) {
                addAction('PATHWAY_COMPLETE', score);
              }
            }}
            durationSeconds={timeRemaining}
            playerCount={playerCount}
          />
        </div>
      )}

      <GameSummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
        totalRevenue={totalScore}
        gameType={activeGame.game_type}
      />
    </div>
  );
}

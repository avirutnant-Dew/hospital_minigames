import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProCareGame, ProCareGameType, PRO_CARE_CONFIG, selectRandomProCareGame, EmpathyScenario, EMPATHY_SCENARIOS } from "./types";
import { HeartCollectorMainDisplay, HeartCollectorGame } from "./HeartCollectorGame";
import { EmpathyEchoMainDisplay, EmpathyEchoGame } from "./EmpathyEchoGame";
import { SmileSparkleMainDisplay, SmileSparkleGame } from "./SmileSparkleGame";
import { ProCareSummaryModal } from "./ProCareSummaryModal";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

interface Props {
  teamId?: string;
  playerNickname?: string;
  isMainStage?: boolean;
  onGameEnd?: (scoreMB: number) => void;
  forcedGameType?: ProCareGameType;
}

export function ProCareController({ teamId, playerNickname, isMainStage = false, onGameEnd, forcedGameType, initialGame }: Props & { initialGame?: ProCareGame | null }) {
  const [activeGame, setActiveGame] = useState<ProCareGame | null>(initialGame || null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const isStarting = useRef(false);

  // stats
  const [csiScore, setCsiScore] = useState(70);
  const [hearts, setHearts] = useState(0);
  const [correctVotes, setCorrectVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [smileTaps, setSmileTaps] = useState(0);
  const [customersHelped, setCustomersHelped] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<EmpathyScenario | null>(null);

  // ======================
  // SYNC INITIAL GAME
  // ======================
  useEffect(() => {
    if (initialGame) {
      setActiveGame(initialGame);
      setTimeRemaining(Math.max(0, Math.floor((new Date(initialGame.ends_at).getTime() - Date.now()) / 1000)));
    }
  }, [initialGame]);

  // ======================
  // SCENARIO MANAGEMENT
  // ======================
  // ======================
  // SCENARIO MANAGEMENT
  // ======================
  useEffect(() => {
    if (activeGame?.game_type === 'EMPATHY_ECHO') {
      // Pick a random scenario if none active
      // Logic: If we switched games (new ID) OR if we don't have a scenario yet
      if (!currentScenario) {
        const random = EMPATHY_SCENARIOS[Math.floor(Math.random() * EMPATHY_SCENARIOS.length)];
        setCurrentScenario(random);
      }
    } else {
      // Reset if not playing Empathy Echo
      if (currentScenario) setCurrentScenario(null);
    }
  }, [activeGame?.id, activeGame?.game_type]);

  // ======================
  // TIMER
  // ======================
  // ======================
  // TIMER
  // ======================
  useEffect(() => {
    if (!activeGame?.ends_at) return;

    // Initialize/Update timeRemaining logic
    const calculateTimeRemaining = () => {
      const remain = Math.floor((new Date(activeGame.ends_at).getTime() - Date.now()) / 1000);
      return Math.max(0, remain);
    };

    // Set initial time if we switched games
    setTimeRemaining(calculateTimeRemaining());

    const timer = setInterval(() => {
      const remain = calculateTimeRemaining();
      setTimeRemaining(remain);

      if (remain <= 0) {
        clearInterval(timer);
        endGame();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame?.id, activeGame?.ends_at]);

  // ======================
  // INITIAL FETCH
  // ======================
  useEffect(() => {
    if (initialGame) return;

    const fetchCurrentGame = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("pro_care_games")
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
          const game = data[0] as unknown as ProCareGame;
          setActiveGame(game);
          const remain = Math.max(0, Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000));
          setTimeRemaining(remain);
        }
      } catch (err) {
        console.error("Error fetching current pro care game:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentGame();
  }, [teamId]);

  // ======================
  // REALTIME
  // ======================
  useEffect(() => {
    const channel = supabase
      .channel("pro-care-main")
      .on("postgres_changes", { event: "*", schema: "public", table: "pro_care_games" }, (payload) => {
        const game = payload.new as ProCareGame;
        if (!game) return;
        if (teamId && game.team_id !== teamId) return;

        if (game.is_active) {
          setActiveGame(game);
          const remain = Math.max(0, Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000));
          setTimeRemaining(remain);
        } else if (activeGame?.id === game.id) {
          setActiveGame(null);
          setShowSummary(true);
          onGameEnd?.(0); // Score calculation happens in endGame, this just triggers UI
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGame?.id, teamId, onGameEnd]);

  // ======================
  // START GAME
  // ======================
  const startGame = async (type?: ProCareGameType) => {
    if (isStarting.current) return;
    isStarting.current = true;
    setIsLoading(true);

    try {
      const gameType = type || selectRandomProCareGame();
      const duration = PRO_CARE_CONFIG[gameType].duration;

      const { data, error } = await supabase
        .from("pro_care_games")
        .insert({
          game_type: gameType,
          team_id: teamId || null,
          ends_at: new Date(Date.now() + duration * 1000).toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to start game:", error);
        return;
      }

      const game = data as unknown as ProCareGame;
      setActiveGame(game);
      setTimeRemaining(duration);
      setHearts(0);
      setCorrectVotes(0);
      setTotalVotes(0);
      setSmileTaps(0);
      setCustomersHelped(0);
      setCsiScore(70);
    } catch (err) {
      console.error("Unhandled error in startGame:", err);
    } finally {
      setIsLoading(false);
      isStarting.current = false;
    }
  };

  // ======================
  // AUTO START
  // ======================
  // AUTO START (Test Mode)
  useEffect(() => {
    if (!forcedGameType || isLoading) return;

    const needsStart = !activeGame || activeGame.game_type !== forcedGameType;

    if (needsStart) {
      startGame(forcedGameType);
    }
  }, [forcedGameType, activeGame?.game_type, isLoading]);

  // ======================
  // END GAME → คิด MB
  // ======================
  const endGame = useCallback(async () => {
    if (!activeGame) return;

    await supabase.from("pro_care_games").update({ is_active: false }).eq("id", activeGame.id);

    let scoreMB = 0;

    if (activeGame.game_type === "HEART_COLLECTOR") {
      scoreMB = hearts * 0.05; // 50,000 บาท = 0.05 MB
    }

    if (activeGame.game_type === "EMPATHY_ECHO") {
      scoreMB = correctVotes * 0.2; // 200,000 บาท = 0.2 MB
    }

    if (activeGame.game_type === "SMILE_SPARKLE") {
      scoreMB = smileTaps * 0.01; // 10,000 บาท = 0.01 MB
    }

    scoreMB = Math.max(0, scoreMB);

    // update team service_score (MB)
    if (teamId) {
      const { data } = await supabase.from("teams").select("service_score").eq("id", teamId).single();

      await supabase
        .from("teams")
        .update({
          service_score: (data?.service_score || 0) + scoreMB,
        })
        .eq("id", teamId);
    }

    setShowSummary(true);
    setActiveGame(null);
    onGameEnd?.(scoreMB);
  }, [activeGame, hearts, correctVotes, smileTaps, teamId, onGameEnd]);

  const handleVote = (correct: boolean) => {
    setTotalVotes(v => v + 1);
    if (correct) {
      setCorrectVotes(v => v + 1);
      setCsiScore(s => Math.min(100, s + PRO_CARE_CONFIG.EMPATHY_ECHO.csiPerCorrect));
    }
    // Pick next scenario after a delay
    setTimeout(() => {
      const next = EMPATHY_SCENARIOS[Math.floor(Math.random() * EMPATHY_SCENARIOS.length)];
      setCurrentScenario(next);
    }, 2000);
  };

  const handleHeartCollect = () => {
    setHearts(h => h + 1);
    setCsiScore(s => Math.min(100, s + PRO_CARE_CONFIG.HEART_COLLECTOR.csiPerHeart));
  };

  const handleSmileTap = () => {
    setSmileTaps(t => t + 1);
    if ((smileTaps + 1) % PRO_CARE_CONFIG.SMILE_SPARKLE.tapsPerSmile === 0) {
      setCustomersHelped(c => c + 1);
      setCsiScore(s => Math.min(100, s + PRO_CARE_CONFIG.SMILE_SPARKLE.csiPerSmile));
    }
  };

  // ======================
  // PLAYER VIEW
  // ======================
  if (!isMainStage) {
    if (!activeGame) {
      return (
        <div className="glass-card p-6 text-center space-y-4">
          {isLoading ? (
            <>
              <Loader2 className="mx-auto w-12 h-12 text-pink-400 animate-spin" />
              <p>กําลังเริ่มเกม...</p>
            </>
          ) : (
            <>
              <Heart className="mx-auto w-12 h-12 text-pink-400" />
              <p>รอ Admin เริ่ม PRO CARE</p>
            </>
          )}
        </div>
      );
    }

    return (
      <>
        {activeGame.game_type === "HEART_COLLECTOR" && (
          <HeartCollectorGame
            onCollect={handleHeartCollect}
            heartsCollected={hearts}
            csiScore={csiScore}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
          />
        )}

        {activeGame.game_type === "EMPATHY_ECHO" && (
          <EmpathyEchoGame
            onVote={handleVote}
            csiScore={csiScore}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
            currentScenario={currentScenario}
          />
        )}

        {activeGame.game_type === "SMILE_SPARKLE" && (
          <SmileSparkleGame
            onTap={handleSmileTap}
            smileTaps={smileTaps}
            customersHelped={customersHelped}
            csiScore={csiScore}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
          />
        )}
      </>
    );
  }

  // ======================
  // MAIN STAGE VIEW
  // ======================
  return (
    <div className="space-y-6">
      {!activeGame ? (
        <div className="glass-card p-8 text-center space-y-4">
          <Heart className="mx-auto w-16 h-16 text-pink-400" />
          <h2 className="text-2xl font-bold">PRO CARE Mini Games</h2>

          <Button onClick={() => startGame("HEART_COLLECTOR")}>💕 Heart Collector</Button>
          <Button onClick={() => startGame("EMPATHY_ECHO")}>💬 Empathy Echo</Button>
          <Button onClick={() => startGame("SMILE_SPARKLE")}>😊 Smile Sparkle</Button>
          <Button onClick={() => startGame()}>🎲 Random</Button>
        </div>
      ) : (
        <>
          {activeGame.game_type === "HEART_COLLECTOR" && (
            <HeartCollectorMainDisplay
              heartsCollected={hearts}
              csiScore={csiScore}
              timeRemaining={timeRemaining}
            />
          )}
          {activeGame.game_type === "EMPATHY_ECHO" && (
            <EmpathyEchoMainDisplay
              currentScenario={currentScenario}
              votesA={correctVotes} // Using correctVotes as A for display simulation
              votesB={totalVotes - correctVotes} // Simulation
              csiScore={csiScore}
              timeRemaining={timeRemaining}
              scenarioTimeLeft={12} // Fixed simulation for display
            />
          )}
          {activeGame.game_type === "SMILE_SPARKLE" && (
            <SmileSparkleMainDisplay
              smileTaps={smileTaps}
              customersHelped={customersHelped}
              currentCustomer={null}
              csiScore={csiScore}
              timeRemaining={timeRemaining}
            />
          )}
        </>
      )}

      <ProCareSummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
        csiScore={csiScore}
        heartsCollected={hearts}
        customersHelped={customersHelped}
        correctVotes={correctVotes}
        totalVotes={totalVotes}
        gameType={activeGame?.game_type || "HEART_COLLECTOR"}
      />
    </div>
  );
}

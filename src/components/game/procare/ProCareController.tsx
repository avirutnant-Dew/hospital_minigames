import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProCareGame, ProCareGameType, PRO_CARE_CONFIG, selectRandomProCareGame } from "./types";
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
}

export function ProCareController({ teamId, playerNickname, isMainStage = false, onGameEnd }: Props) {
  const [activeGame, setActiveGame] = useState<ProCareGame | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // stats
  const [hearts, setHearts] = useState(0);
  const [correctVotes, setCorrectVotes] = useState(0);
  const [smileTaps, setSmileTaps] = useState(0);

  // ======================
  // TIMER
  // ======================
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

    const timer = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame]);

  // ======================
  // START GAME
  // ======================
  const startGame = async (type?: ProCareGameType) => {
    setIsLoading(true);
    const gameType = type || selectRandomProCareGame();
    const duration = PRO_CARE_CONFIG[gameType].duration;

    const { data, error } = await supabase
      .from("pro_care_games")
      .insert({
        game_type: gameType,
        team_id: teamId,
        ends_at: new Date(Date.now() + duration * 1000).toISOString(),
        is_active: true,
      })
      .select()
      .single();

    setIsLoading(false);
    if (error) {
      console.error(error);
      return;
    }

    setActiveGame(data);
    setTimeRemaining(duration);
    setHearts(0);
    setCorrectVotes(0);
    setSmileTaps(0);
  };

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
  }, [activeGame, hearts, correctVotes, smileTaps]);

  // ======================
  // PLAYER VIEW
  // ======================
  if (!isMainStage) {
    if (!activeGame) {
      return (
        <div className="glass-card p-6 text-center">
          <Heart className="mx-auto w-12 h-12 text-pink-400" />
          <p>รอ Admin เริ่ม PRO CARE</p>
        </div>
      );
    }

    return (
      <>
        {activeGame.game_type === "HEART_COLLECTOR" && (
          <HeartCollectorGame
            onCollect={() => setHearts((h) => h + 1)}
            heartsCollected={hearts}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
          />
        )}

        {activeGame.game_type === "EMPATHY_ECHO" && (
          <EmpathyEchoGame
            onVote={(correct) => correct && setCorrectVotes((c) => c + 1)}
            timeRemaining={timeRemaining}
            isActive={timeRemaining > 0}
          />
        )}

        {activeGame.game_type === "SMILE_SPARKLE" && (
          <SmileSparkleGame
            onTap={() => setSmileTaps((s) => s + 1)}
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
            <HeartCollectorMainDisplay heartsCollected={hearts} timeRemaining={timeRemaining} />
          )}
          {activeGame.game_type === "EMPATHY_ECHO" && (
            <EmpathyEchoMainDisplay correctVotes={correctVotes} timeRemaining={timeRemaining} />
          )}
          {activeGame.game_type === "SMILE_SPARKLE" && (
            <SmileSparkleMainDisplay smileTaps={smileTaps} timeRemaining={timeRemaining} />
          )}
        </>
      )}

      <ProCareSummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
        heartsCollected={hearts}
        correctVotes={correctVotes}
        smileTaps={smileTaps}
        gameType={activeGame?.game_type || "HEART_COLLECTOR"}
      />
    </div>
  );
}

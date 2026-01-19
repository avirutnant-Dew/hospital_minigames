import { useSearchParams, useNavigate } from "react-router-dom";
import { ProCareController } from "@/components/game/procare/ProCareController";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export default function ProCarePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = searchParams.get("team") || undefined;
  const playerNickname = searchParams.get("player") || undefined;

  // Redirect to main stage if no team ID is provided
  useEffect(() => {
    if (!teamId) {
      const timer = setTimeout(() => {
        navigate("/stage");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [teamId, navigate]);

  const clearPendingChallenge = async () => {
    try {
      const { data: gs } = await supabase.from("game_state").select("id").limit(1).single();
      if (gs) {
        await supabase.from("game_state").update({
          pending_challenge_game_type: null,
          pending_challenge_team_id: null,
        }).eq("id", gs.id);
      }
    } catch (err) {
      console.error("Failed to clear pending challenge:", err);
    }
  };

  const handleGameEnd = async (score: number) => {
    // Clear the pending challenge and navigate back to main stage
    await clearPendingChallenge();
    // Small delay to ensure state is cleared before navigation
    setTimeout(() => {
      navigate("/stage");
    }, 500);
  };

  const handleReturnToStage = async () => {
    // Clear pending challenge before returning
    await clearPendingChallenge();
    navigate("/stage");
  };

  // Show error if no team ID
  if (!teamId) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5 p-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center space-y-6">
            <AlertCircle className="w-20 h-20 mx-auto text-destructive animate-pulse" />
            <h2 className="text-2xl font-display font-bold">Game Not Available</h2>
            <p className="text-muted-foreground">
              This mini-game needs to be started from the main game board by a team.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to main stage in 2 seconds...
            </p>
            <Button onClick={handleReturnToStage} className="w-full">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Go to Main Stage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToStage}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Main Stage
          </Button>
        </div>

        {/* Mini-game Content */}
        <div className="flex items-center justify-center min-h-[600px]">
          <ProCareController
            teamId={teamId}
            playerNickname={playerNickname}
            isMainStage={true}
            onGameEnd={handleGameEnd}
          />
        </div>
      </div>
    </div>
  );
}

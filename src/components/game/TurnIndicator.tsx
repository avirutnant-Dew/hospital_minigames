import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

interface Team {
  id: string;
  name: string;
  color: string;
}

export function TurnIndicator() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const fetchGameState = async () => {
      const { data: stateData } = await supabase
        .from("game_state")
        .select("current_turn_team_id, is_dice_locked")
        .limit(1)
        .single();

      if (stateData?.current_turn_team_id) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", stateData.current_turn_team_id)
          .single();
        
        if (teamData) setCurrentTeam(teamData);
        setIsLocked(stateData.is_dice_locked);
      }
    };
    fetchGameState();

    const channel = supabase
      .channel("turn-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_state" },
        () => fetchGameState()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!currentTeam) {
    return (
      <div className="glass-card p-4 text-center">
        <p className="text-muted-foreground">รอ Admin เริ่มเกม...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card p-6 text-center transition-all duration-500",
        !isLocked && "glow-border"
      )}
      style={{
        borderColor: currentTeam.color,
        boxShadow: !isLocked ? `0 0 30px ${currentTeam.color}40` : undefined,
      }}
    >
      <div className="flex items-center justify-center gap-3 mb-2">
        <Crown className="w-6 h-6 text-accent" />
        <span className="text-sm text-muted-foreground font-display">ตาของ</span>
        <Crown className="w-6 h-6 text-accent" />
      </div>
      
      <h2 
        className="text-3xl font-display font-bold glow-text"
        style={{ color: currentTeam.color }}
      >
        {currentTeam.name}
      </h2>
      
      <div className="mt-3 flex justify-center">
        <div
          className={cn(
            "px-4 py-1 rounded-full text-sm font-semibold",
            isLocked 
              ? "bg-destructive/20 text-destructive" 
              : "bg-strategy-grow/20 text-strategy-grow animate-pulse"
          )}
        >
          {isLocked ? "🔒 ล็อคอยู่" : "🎲 พร้อมทอย!"}
        </div>
      </div>
    </div>
  );
}

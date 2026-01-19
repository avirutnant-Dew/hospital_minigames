import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AmbulanceToken } from "./AmbulanceToken";
import { GameTile } from "./GameTile";

interface Team {
  id: string;
  name: string;
  color: string;
  current_tile: number;
}

const BOARD_TILES = [
  // Row 1 (0-5)
  { id: 0, type: "start", label: "START" },
  { id: 1, type: "grow", label: "Grow+" },
  { id: 2, type: "safe", label: "Safe Act" },
  { id: 3, type: "care", label: "ProCare" },
  { id: 4, type: "bonus", label: "Bonus" },
  { id: 5, type: "challenge", label: "Challenge" },
  // Row 2 (6-11)
  { id: 6, type: "grow", label: "Grow+" },
  { id: 7, type: "safe", label: "Safe Act" },
  { id: 8, type: "care", label: "ProCare" },
  { id: 9, type: "grow", label: "Grow+" },
  { id: 10, type: "bonus", label: "Bonus" },
  { id: 11, type: "safe", label: "Safe Act" },
  // Row 3 (12-17)
  { id: 12, type: "care", label: "ProCare" },
  { id: 13, type: "challenge", label: "Challenge" },
  { id: 14, type: "grow", label: "Grow+" },
  { id: 15, type: "safe", label: "Safe Act" },
  { id: 16, type: "care", label: "ProCare" },
  { id: 17, type: "bonus", label: "Bonus" },
  // Row 4 (18-23)
  { id: 18, type: "grow", label: "Grow+" },
  { id: 19, type: "safe", label: "Safe Act" },
  { id: 20, type: "care", label: "ProCare" },
  { id: 21, type: "challenge", label: "Challenge" },
  { id: 22, type: "grow", label: "Grow+" },
  { id: 23, type: "finish", label: "GOAL 1,150M" },
];

export function GameBoard() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from("teams").select("*").order("name");
      if (data) setTeams(data);
    };
    fetchTeams();

    const channel = supabase
      .channel("teams-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => fetchTeams()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTeamColor = (index: number) => {
    const colors = ["team-alpha", "team-beta", "team-gamma", "team-delta", "team-omega"];
    return colors[index] || colors[0];
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto p-4">
      {/* Board Background with Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-3xl blur-3xl" />
      
      {/* Isometric Board Container */}
      <div 
        className="relative grid grid-cols-6 gap-3 p-6 glass-card"
        style={{ perspective: "1000px" }}
      >
        {BOARD_TILES.map((tile, index) => (
          <GameTile key={tile.id} tile={tile} index={index} />
        ))}
        
        {/* Ambulance Tokens */}
        {teams.map((team, index) => (
          <AmbulanceToken
            key={team.id}
            team={team}
            colorClass={getTeamColor(index)}
            position={team.current_tile}
            totalTiles={BOARD_TILES.length}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
    </div>
  );
}

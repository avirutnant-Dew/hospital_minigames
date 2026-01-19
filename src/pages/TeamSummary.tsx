import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Users, Crown, ArrowLeft, Play } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;
type Player = Tables<"players">;

export default function TeamSummary() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch teams and players on mount
  useEffect(() => {
    const fetchData = async () => {
      const [teamsRes, playersRes] = await Promise.all([
        supabase.from("teams").select("*").order("name"),
        supabase.from("players").select("*").order("created_at"),
      ]);

      if (teamsRes.data) setTeams(teamsRes.data);
      if (playersRes.data) setPlayers(playersRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Realtime subscription for players
  useEffect(() => {
    const channel = supabase
      .channel("team-summary-players")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "DELETE") {
            setPlayers((prev) =>
              prev.filter((p) => p.id !== (payload.old as Player).id)
            );
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Player).id
                  ? (payload.new as Player)
                  : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Group players by team
  const teamData = useMemo(() => {
    return teams.map((team) => ({
      ...team,
      members: players
        .filter((p) => p.team_id === team.id)
        .sort((a, b) => (a.role === "CAPTAIN" ? -1 : 1)),
    }));
  }, [teams, players]);

  const totalPlayers = players.length;

  const getTeamColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "from-blue-500/20 to-blue-600/10 border-blue-500/50",
      green: "from-green-500/20 to-green-600/10 border-green-500/50",
      yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/50",
      red: "from-red-500/20 to-red-600/10 border-red-500/50",
      purple: "from-purple-500/20 to-purple-600/10 border-purple-500/50",
    };
    return colorMap[color.toLowerCase()] || "from-primary/20 to-primary/10 border-primary/50";
  };

  const getTeamAccentColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-400",
      green: "text-green-400",
      yellow: "text-yellow-400",
      red: "text-red-400",
      purple: "text-purple-400",
    };
    return colorMap[color.toLowerCase()] || "text-primary";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูลทีม...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass-card p-6 text-center space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับ
              </Button>
            </Link>
            <Link to="/stage">
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Play className="w-4 h-4 mr-2" />
                เริ่มเกม
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            <Activity className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-3xl lg:text-4xl font-display font-bold">
              <span className="text-gradient">Team Summary</span>
            </h1>
            <p className="text-muted-foreground">รอผู้เล่นเข้าร่วมทีม</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xl font-semibold">
            <Users className="w-6 h-6 text-accent" />
            <span className="text-accent">{totalPlayers}</span>
            <span className="text-muted-foreground">Players</span>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {teamData.map((team) => (
            <div
              key={team.id}
              className={`glass-card p-5 border-2 bg-gradient-to-b ${getTeamColorClass(team.color)} transition-all hover:scale-[1.02]`}
            >
              {/* Team Header */}
              <div className="text-center mb-4">
                <h2 className={`text-xl font-display font-bold ${getTeamAccentColor(team.color)}`}>
                  {team.name}
                </h2>
                <div className="neon-line mt-2 mx-auto max-w-[60px]" />
              </div>

              {/* Members List */}
              <div className="space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto">
                {team.members.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    รอผู้เล่น...
                  </p>
                ) : (
                  team.members.map((member, idx) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        member.role === "CAPTAIN"
                          ? "bg-accent/20 border border-accent/30"
                          : "bg-muted/20"
                      } animate-fade-in`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {member.role === "CAPTAIN" ? (
                        <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground text-xs">
                          •
                        </span>
                      )}
                      <span
                        className={`text-sm truncate ${
                          member.role === "CAPTAIN"
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {member.nickname}
                      </span>
                      {member.role === "CAPTAIN" && (
                        <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                          Captain
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Member Count */}
              <div className="mt-4 pt-3 border-t border-border/50 text-center">
                <span className={`text-2xl font-bold ${getTeamAccentColor(team.color)}`}>
                  {team.members.length}
                </span>
                <span className="text-muted-foreground text-sm ml-1">คน</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm">
          <p>แสดงผลแบบ Realtime • ข้อมูลอัพเดททันทีเมื่อมีผู้เล่นเข้าร่วม</p>
        </div>
      </div>
    </div>
  );
}

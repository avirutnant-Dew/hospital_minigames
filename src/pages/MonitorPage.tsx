import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { TurnIndicator } from "@/components/game/TurnIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Maximize2, BarChart3, Trophy, Users, Zap, Activity } from "lucide-react";

type ViewMode = "board" | "score" | "turn" | "teams" | "dashboard" | "leaderboard" | "activity" | "metrics";

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
  total_revenue: number;
  target_revenue: number;
  is_challenge_active?: boolean;
  pending_challenge_game_type?: string;
}

interface PlayerScore {
  nickname: string;
  score: number;
  batch_count: number;
}

interface ActivityEvent {
  id: string;
  player: string;
  action: string;
  score: number;
  timestamp: string;
}

export default function MonitorPage() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  
  // Read URL params for monitor-specific view
  const minigameType = searchParams.get("minigame");
  const minigameView = searchParams.get("view");

  const refreshAll = useCallback(async () => {
    const [{ data: gs }, { data: t }] = await Promise.all([
      supabase.from("game_state").select("*").limit(1).maybeSingle(),
      supabase.from("teams").select("*").order("revenue_score", { ascending: false }),
    ]);

    if (gs) setGameState(gs as GameState);
    if (t) setTeams(t as Team[]);
  }, []);

  // Fetch leaderboard when minigame is active
  useEffect(() => {
    if (!minigameType) return;

    const fetchLeaderboard = async () => {
      const tableName = `${minigameType}_scores`;
      const { data } = await supabase.from(tableName).select('player_nickname, score_value').order('created_at', { ascending: false }).limit(100);

      if (data) {
        const aggregated: Record<string, number> = {};
        data.forEach((row) => {
          aggregated[row.player_nickname] = (aggregated[row.player_nickname] || 0) + row.score_value;
        });

        const scores = Object.entries(aggregated)
          .map(([nickname, score]) => ({
            nickname,
            score,
            batch_count: data.filter(d => d.player_nickname === nickname).length
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        setPlayerScores(scores);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [minigameType]);

  // Subscribe to activity feed
  useEffect(() => {
    if (!minigameType) return;

    const tableName = `${minigameType}_scores`;
    const channel = supabase
      .channel(`monitor-activity-${minigameType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          const event: ActivityEvent = {
            id: payload.new.id,
            player: payload.new.player_nickname,
            action: `+${(payload.new.score_value / 1_000_000).toFixed(1)}M`,
            score: payload.new.score_value,
            timestamp: new Date().toLocaleTimeString(),
          };
          setActivityEvents((prev) => [event, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [minigameType]);

  useEffect(() => {
    refreshAll();

    const channel = supabase
      .channel("monitor-realtime")
      .on("postgres_changes", { event: "*", table: "game_state", schema: "public" }, () => refreshAll())
      .on("postgres_changes", { event: "*", table: "teams", schema: "public" }, () => refreshAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll]);

  // Set view mode from URL params if minigame is active
  useEffect(() => {
    if (minigameView) {
      setViewMode(minigameView as ViewMode);
    }
  }, [minigameView]);

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Activity className="w-4 h-4" /> },
    { id: "board", label: "Board", icon: <Maximize2 className="w-4 h-4" /> },
    { id: "score", label: "Score", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "turn", label: "Current Turn", icon: <Zap className="w-4 h-4" /> },
    { id: "teams", label: "Rankings", icon: <Trophy className="w-4 h-4" /> },
    ...(minigameType ? [
      { id: "leaderboard" as ViewMode, label: "Game Leaderboard", icon: <Trophy className="w-4 h-4" /> },
      { id: "activity" as ViewMode, label: "Activity Feed", icon: <Activity className="w-4 h-4" /> },
    ] : []),
  ];

  const toMB = (baht: number) => baht / 1_000_000;
  const formatMB = (baht: number, digits = 1) => `${toMB(baht).toFixed(digits)} MB`;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header with View Selector */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-display font-bold">Hospital Monitor</h1>
                <p className="text-xs text-muted-foreground">Select view mode below</p>
              </div>
            </div>

            {/* Progress Bar */}
            {gameState && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Hospital Target</p>
                  <p className="text-lg font-display font-bold text-accent">
                    {formatMB(gameState.total_revenue, 1)} / {formatMB(gameState.target_revenue, 0)}
                  </p>
                </div>
                <div className="w-48 h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{
                      width: `${Math.min(
                        (gameState.total_revenue / gameState.target_revenue) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* View Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {views.map((view) => (
              <Button
                key={view.id}
                onClick={() => setViewMode(view.id)}
                variant={viewMode === view.id ? "default" : "outline"}
                className={cn("gap-2 whitespace-nowrap", viewMode === view.id && "bg-primary")}
              >
                {view.icon}
                {view.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="neon-line" />
      </header>

      {/* Content Area */}
      <main className="container mx-auto p-4 h-[calc(100vh-200px)] overflow-auto">
        {/* Dashboard View - All Content */}
        {viewMode === "dashboard" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GameBoard />
              </div>
              <div>
                <ScoreBoard />
              </div>
            </div>
          </div>
        )}

        {/* Full Board View */}
        {viewMode === "board" && (
          <div className="flex items-center justify-center h-full">
            <div className="w-full">
              <GameBoard />
            </div>
          </div>
        )}

        {/* Full Score View */}
        {viewMode === "score" && (
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-4xl">
              <ScoreBoard />
            </div>
          </div>
        )}

        {/* Current Turn View */}
        {viewMode === "turn" && (
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-2xl">
              <TurnIndicator />
            </div>
          </div>
        )}

        {/* Team Rankings View */}
        {viewMode === "teams" && (
          <div className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-display font-bold text-gradient mb-2">Team Rankings</h2>
              <p className="text-lg text-muted-foreground">
                {formatMB(
                  teams.reduce((sum, t) => sum + (t.revenue_score || 0), 0),
                  1
                )}{" "}
                / {gameState ? formatMB(gameState.target_revenue, 0) : "N/A"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team, index) => (
                <Card
                  key={team.id}
                  className={cn(
                    "glass-card",
                    index === 0 && "ring-2 ring-yellow-400 border-yellow-400/50",
                    index === 1 && "ring-2 ring-gray-300 border-gray-300/50",
                    index === 2 && "ring-2 ring-orange-400 border-orange-400/50"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </div>
                      <div className="text-2xl font-bold">#{index + 1}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Revenue Score</p>
                      <p className="text-3xl font-display font-bold text-strategy-grow">
                        {formatMB(team.revenue_score, 1)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Safety</p>
                        <p className="text-xl font-bold text-accent">
                          {formatMB(team.safety_score, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Service</p>
                        <p className="text-xl font-bold text-accent">
                          {formatMB(team.service_score, 0)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="text-lg font-display font-bold">Tile {team.current_tile}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mini-game Leaderboard View */}
        {viewMode === "leaderboard" && minigameType && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-display font-bold text-gradient mb-2 capitalize">
                {minigameType} Leaderboard
              </h2>
              <p className="text-lg text-muted-foreground">Top 10 Players - Live Rankings</p>
            </div>

            <div className="grid gap-3 max-w-2xl mx-auto">
              {playerScores.map((player, idx) => (
                <Card key={idx} className={cn(
                  "glass-card",
                  idx === 0 && "ring-2 ring-yellow-400 border-yellow-400/50",
                  idx === 1 && "ring-2 ring-gray-300 border-gray-300/50",
                  idx === 2 && "ring-2 ring-orange-400 border-orange-400/50"
                )}>
                  <CardContent className="py-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-display font-bold w-12 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>
                      <div>
                        <p className="font-semibold">{player.nickname}</p>
                        <p className="text-xs text-muted-foreground">{player.batch_count} actions</p>
                      </div>
                    </div>
                    <p className="text-2xl font-display font-bold text-accent">
                      {formatMB(player.score, 1)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {playerScores.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No player data yet...</p>
              </div>
            )}
          </div>
        )}

        {/* Activity Feed View */}
        {viewMode === "activity" && minigameType && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-display font-bold text-gradient mb-2 capitalize">
                {minigameType} Activity Feed
              </h2>
              <p className="text-lg text-muted-foreground">Live Player Actions</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-2">
              {activityEvents.map((event, idx) => (
                <div 
                  key={event.id || idx}
                  className="glass-card p-4 rounded-lg border-l-4 border-accent animate-scale-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">⭐</div>
                      <div>
                        <p className="font-semibold">{event.player}</p>
                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-accent animate-ticker-pulse">
                        {event.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activityEvents.length === 0 && (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Waiting for player actions...</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

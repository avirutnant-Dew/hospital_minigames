import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Team {
  id: string;
  name: string;
  color: string;
  current_tile: number;
  revenue_score: number;
}

interface GameState {
  id: string;
  current_turn_team_id: string | null;
}

export default function MiniGameTestPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      const [teamsRes, stateRes] = await Promise.all([
        supabase.from("teams").select("*"),
        supabase.from("game_state").select("*").limit(1).single(),
      ]);

      if (teamsRes.data) setTeams(teamsRes.data as Team[]);
      if (stateRes.data) setGameState(stateRes.data as GameState);
    };

    loadData();
  }, []);

  const runTest = async (gameName: string, path: string, teamId?: string) => {
    setLoading(true);
    
    try {
      // Navigate directly with team ID
      if (teamId) {
        navigate(`${path}&team=${teamId}`);
      } else {
        navigate(path);
      }
    } catch (err) {
      console.error(`Failed to test ${gameName}:`, err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold">🎮 Mini-Game Test Center</h1>
          <p className="text-lg text-muted-foreground">Test all mini-games to verify they work</p>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {teams.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  Teams
                </p>
                <p className="text-2xl font-bold">{teams.length}</p>
                {teams.length === 0 && (
                  <p className="text-xs text-yellow-600">⚠️ No teams found. Create teams first in Admin Dashboard.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {gameState ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  Game State
                </p>
                <p className="text-2xl font-bold">{gameState ? "Ready" : "Missing"}</p>
                {!gameState && (
                  <p className="text-xs text-yellow-600">⚠️ Game state not initialized.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {gameState?.current_turn_team_id ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  Current Team
                </p>
                <p className="text-2xl font-bold">
                  {gameState?.current_turn_team_id
                    ? teams.find((t) => t.id === gameState.current_turn_team_id)?.name || "Unknown"
                    : "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Teams */}
        {teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="font-bold">{team.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        Tile {team.current_tile}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Revenue: {(team.revenue_score / 1_000_000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-gray-500">ID: {team.id}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mini-Game Tests */}
        {teams.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>GrowPlus (Revenue Strategy)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click to play GrowPlus mini-games (Revenue Tap, Hospital Network, Department Efficiency)
                </p>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={`growplus-${team.id}`} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-semibold text-sm">{team.name}</span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-2 ml-4">
                        <Button
                          onClick={() => runTest("revenue-tap", "/minigame/growplus?game=REVENUE_TAP", team.id)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          💰 Revenue Tap
                        </Button>
                        <Button
                          onClick={() => runTest("hospital-network", "/minigame/growplus?game=HOSPITAL_NETWORK", team.id)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          🏥 Hospital Network
                        </Button>
                        <Button
                          onClick={() => runTest("dept-efficiency", "/minigame/growplus?game=DEPARTMENT_EFFICIENCY", team.id)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          🚑 Dept Efficiency
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SafeAct (Safety Strategy)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click to play SafeAct mini-game (3 sub-games: Risk Defender, Critical Sync, Hazard Popper)
                </p>
                <div className="grid md:grid-cols-2 gap-2">
                  {teams.map((team) => (
                    <Button
                      key={`safeact-${team.id}`}
                      onClick={() => runTest("safeact", "/minigame/safeact", team.id)}
                      disabled={loading}
                      className="w-full"
                      variant={testResults[`safeact-${team.id}`] ? "default" : "outline"}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : "🛡️"}
                      Play with {team.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ProCare (Service Strategy)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click to play ProCare mini-game (3 sub-games: Heart Collector, Empathy Echo, Smile Sparkle)
                </p>
                <div className="grid md:grid-cols-2 gap-2">
                  {teams.map((team) => (
                    <Button
                      key={`procare-${team.id}`}
                      onClick={() => runTest("procare", "/minigame/procare", team.id)}
                      disabled={loading}
                      className="w-full"
                      variant={testResults[`procare-${team.id}`] ? "default" : "outline"}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : "❤️"}
                      Play with {team.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Challenge (Board Challenge)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click to play Question Challenge (3 random questions from database)
                </p>
                <div className="grid md:grid-cols-2 gap-2">
                  {teams.map((team) => (
                    <Button
                      key={`challenge-${team.id}`}
                      onClick={() => runTest("challenge", "/minigame/challenge", team.id)}
                      disabled={loading}
                      className="w-full"
                      variant={testResults[`challenge-${team.id}`] ? "default" : "outline"}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : "💡"}
                      Play with {team.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Help Section */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">📋 Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-yellow-800">
            <p>
              <strong>No teams showing?</strong> Create teams in{" "}
              <Button variant="link" className="h-auto p-0 text-yellow-700 underline" onClick={() => navigate("/admin")}>
                Admin Dashboard
              </Button>
            </p>
            <p>
              <strong>Game selection screen appears?</strong> This is normal! Click a game button to start playing.
            </p>
            <p>
              <strong>Game doesn't load?</strong> Check browser console (F12) for errors and make sure Supabase is
              connected.
            </p>
            <p>
              <strong>Want to go back?</strong> Each game has a "Back to Main Stage" button.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

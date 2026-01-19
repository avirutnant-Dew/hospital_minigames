import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Player {
  id: string;
  nickname: string;
  team_id: string;
  role: "CAPTAIN" | "CREW";
  session_id?: string;
  team_name?: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

export default function AdminPlayerManagement() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("admin-players-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch players
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch teams
      const { data: teamsData } = await supabase.from("teams").select("*").order("name");

      if (playersData) {
        // Enhance players with team names
        const enrichedPlayers = playersData.map((player: any) => ({
          ...player,
          team_name: teamsData?.find((t: any) => t.id === player.team_id)?.name || "No Team",
        }));
        setPlayers(enrichedPlayers);
      }

      if (teamsData) {
        setTeams(teamsData as Team[]);
        // Set first team as default if not selected
        if (!selectedTeamId && teamsData.length > 0) {
          setSelectedTeamId(teamsData[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error("Please enter player name");
      return;
    }

    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("players").insert({
        nickname: newPlayerName.trim(),
        team_id: selectedTeamId,
        role: "CREW",
      });

      if (error) {
        toast.error("Failed to add player");
        console.error(error);
      } else {
        toast.success(`✅ Added ${newPlayerName} to ${teams.find((t) => t.id === selectedTeamId)?.name}`);
        setNewPlayerName("");
        setOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error("Error adding player");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Delete player ${playerName}?`)) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("players").delete().eq("id", playerId);

      if (error) {
        toast.error("Failed to delete player");
        console.error(error);
      } else {
        toast.success(`Deleted ${playerName}`);
        fetchData();
      }
    } catch (err) {
      toast.error("Error deleting player");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playersByTeam = teams.map((team) => ({
    team,
    players: players.filter((p) => p.team_id === team.id),
  }));

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      {/* Header */}
      <header className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="hover:bg-accent/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold">👥 Player Management</h1>
              <p className="text-muted-foreground">Add and manage players for each team</p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-strategy-grow hover:bg-strategy-grow/90">
                <UserPlus className="w-4 h-4" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Player Name</label>
                  <Input
                    placeholder="Enter player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addPlayer();
                      }
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Select Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={loading || teams.length === 0}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="">-- Choose Team --</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {teams.length === 0 && (
                    <p className="text-xs text-destructive mt-2">⚠️ No teams found. Create teams first in the admin dashboard.</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addPlayer}
                    disabled={loading || !newPlayerName.trim() || !selectedTeamId}
                    className="bg-strategy-grow hover:bg-strategy-grow/90"
                  >
                    {loading ? "Adding..." : "Add Player"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-muted-foreground text-sm">Total Players</p>
                <p className="text-3xl font-display font-bold">{players.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              <div>
                <p className="text-muted-foreground text-sm">Teams</p>
                <p className="text-3xl font-display font-bold">{teams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams and Players */}
      <div className="space-y-6">
        {playersByTeam.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No teams found. Create teams in the main admin dashboard.</p>
          </Card>
        ) : (
          playersByTeam.map(({ team, players: teamPlayers }) => (
            <Card key={team.id} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: team.color }} />
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{teamPlayers.length} player(s)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {teamPlayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No players yet. Add the first player!</p>
                ) : (
                  <div className="grid gap-2">
                    {teamPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{player.nickname}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(player.created_at).toLocaleDateString("th-TH")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePlayer(player.id, player.nickname)}
                          disabled={loading}
                          className="text-destructive hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

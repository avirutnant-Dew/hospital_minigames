import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Unlock, Lock, Play, SkipForward, RotateCcw, Users, Target, Zap, Settings, StopCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  color: string;
  current_tile: number;
  revenue_score: number; // BAHT
  safety_score: number; // BAHT
  service_score: number; // BAHT
}

interface GameState {
  id: string;
  current_turn_team_id: string | null;
  is_dice_locked: boolean;
  is_challenge_active: boolean;
  total_revenue: number;
  target_revenue: number; // BAHT (เช่น 1150000000)
  pending_challenge_title: string | null;
  pending_challenge_game_type: string | null;
  pending_challenge_team_id: string | null;
  challenge_type: string | null;
}

const MB_DIVISOR = 1_000_000;

// ปุ่ม +10/+50 ให้เพิ่มเป็น “MB”
const STEP_SMALL_MB = 10;
const STEP_LARGE_MB = 50;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    const [teamsRes, stateRes] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("game_state").select("*").limit(1).single(),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data as Team[]);
    if (stateRes.data) setGameState(stateRes.data as GameState);
  };

  const getCurrentTeam = () => teams.find((t) => t.id === gameState?.current_turn_team_id);

  // Tile type mapping for board
  const BOARD_TILES = [
    { id: 0, type: "start" },
    { id: 1, type: "grow" },
    { id: 2, type: "safe" },
    { id: 3, type: "care" },
    { id: 4, type: "bonus" },
    { id: 5, type: "challenge" },
    { id: 6, type: "grow" },
    { id: 7, type: "safe" },
    { id: 8, type: "care" },
    { id: 9, type: "grow" },
    { id: 10, type: "bonus" },
    { id: 11, type: "safe" },
    { id: 12, type: "care" },
    { id: 13, type: "challenge" },
    { id: 14, type: "grow" },
    { id: 15, type: "safe" },
    { id: 16, type: "care" },
    { id: 17, type: "bonus" },
    { id: 18, type: "grow" },
    { id: 19, type: "safe" },
    { id: 20, type: "care" },
    { id: 21, type: "challenge" },
    { id: 22, type: "grow" },
    { id: 23, type: "finish" },
  ];

  const getTileType = (tileId: number): string => {
    const tile = BOARD_TILES.find((t) => t.id === tileId);
    return tile?.type || "start";
  };

  const getGameTypeForTile = (tileType: string): string => {
    switch (tileType) {
      case "grow":
        return "growplus";
      case "safe":
        return "safeact";
      case "care":
        return "procare";
      case "challenge":
        return "challenge"; // Question challenge
      default:
        return "";
    }
  };

  // ---------- Formatting ----------
  const formatBaht = (value: number) => new Intl.NumberFormat("th-TH").format(Math.round(value));

  const toMB = (baht: number) => baht / MB_DIVISOR;

  const formatMB = (baht: number, digits = 1) => `${toMB(baht).toFixed(digits)} MB`;

  // ---------- Totals (ALL IN BAHT) ----------
  const totalMoneyBaht = teams.reduce(
    (sum, t) => sum + (t.revenue_score || 0) + (t.safety_score || 0) + (t.service_score || 0),
    0,
  );

  const targetBaht = gameState?.target_revenue ?? 1_150_000_000; // fallback
  const progressPercent = targetBaht > 0 ? (totalMoneyBaht / targetBaht) * 100 : 0;

  // ---------- Actions ----------
  const moveTile = async (teamId: string, steps: number) => {
    if (!gameState) return;
    setLoading(true);

    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;

      const newTile = (team.current_tile + steps) % BOARD_TILES.length;
      const tileType = getTileType(newTile);
      const gameType = getGameTypeForTile(tileType);

      // Update team tile position
      await supabase.from("teams").update({ current_tile: newTile }).eq("id", teamId);

      // If landed on a challenge tile, set pending challenge
      if (gameType) {
        const titleMap: { [key: string]: string } = {
          growplus: "🌟 Grow+ Challenge",
          safeact: "🛡️ SafeAct Challenge",
          procare: "❤️ ProCare Challenge",
          challenge: "💡 Question Challenge",
        };

        let challengeType = "";
        if (gameType === "growplus") challengeType = "GROW_PLUS";
        else if (gameType === "safeact") challengeType = "SAFE_ACT";
        else if (gameType === "procare") challengeType = "PRO_CARE";
        else if (gameType === "challenge") challengeType = "CHALLENGE";

        await supabase
          .from("game_state")
          .update({
            pending_challenge_team_id: teamId,
            pending_challenge_game_type: gameType,
            pending_challenge_title: titleMap[gameType] || "Challenge",
            challenge_type: challengeType,
          })
          .eq("id", gameState.id);

        toast.success(`🎯 ${team.name} landed on ${tileType} tile (${gameType})!`);
      } else {
        toast.success(`🎯 ${team.name} moved to tile ${newTile}`);
      }
    } catch (err) {
      toast.error("Failed to move tile");
    }

    setLoading(false);
  };

  const toggleDiceLock = async () => {
    if (!gameState) return;
    setLoading(true);

    const { error } = await supabase
      .from("game_state")
      .update({ is_dice_locked: !gameState.is_dice_locked })
      .eq("id", gameState.id);

    if (!error) {
      toast.success(gameState.is_dice_locked ? "🎲 ปลดล็อคลูกเต๋าแล้ว!" : "🔒 ล็อคลูกเต๋าแล้ว");
    }
    setLoading(false);
  };

  const startPendingChallenge = async () => {
    if (!gameState || !gameState.pending_challenge_game_type) return;
    setLoading(true);

    const duration = 30;
    const endsAt = new Date(Date.now() + duration * 1000).toISOString();
    const teamId = gameState.pending_challenge_team_id;
    const gameType = gameState.pending_challenge_game_type;
    let challengeType = gameState.challenge_type;

    if (!challengeType) {
      if (["REVENUE_TAP", "SBU_COMBO", "REFERRAL_LINK"].includes(gameType)) {
        challengeType = "GROW_PLUS";
      } else if (["HAZARD_POPPER", "RISK_DEFENDER", "CRITICAL_SYNC"].includes(gameType)) {
        challengeType = "SAFE_ACT";
      } else if (["HEART_COLLECTOR", "EMPATHY_ECHO", "SMILE_SPARKLE"].includes(gameType)) {
        challengeType = "PRO_CARE";
      }
    }

    // IMPORTANT: Close all old active games for this team BEFORE inserting new one
    if (challengeType === "GROW_PLUS") {
      // Close old GROW_PLUS games for this team
      await supabase
        .from("grow_plus_games")
        .update({ is_active: false })
        .eq("team_id", teamId)
        .eq("is_active", true);
      
      await supabase.from("grow_plus_games").insert({
        game_type: gameType,
        team_id: teamId,
        ends_at: endsAt,
        is_active: true,
        total_score: 0,
        combo_multiplier: 1,
      });
    } else if (challengeType === "SAFE_ACT") {
      // Close old SAFE_ACT games for this team
      await supabase
        .from("safe_act_games")
        .update({ is_active: false })
        .eq("team_id", teamId)
        .eq("is_active", true);
      
      await supabase.from("safe_act_games").insert({
        game_type: gameType,
        team_id: teamId,
        ends_at: endsAt,
        is_active: true,
        shield_health: 100,
        total_correct: 0,
        total_wrong: 0,
        hazards_cleared: 0,
        combo_multiplier: 1,
      });
    } else if (challengeType === "PRO_CARE") {
      // Close old PRO_CARE games for this team
      await supabase
        .from("pro_care_games")
        .update({ is_active: false })
        .eq("team_id", teamId)
        .eq("is_active", true);
      
      await supabase.from("pro_care_games").insert({
        game_type: gameType,
        team_id: teamId,
        ends_at: endsAt,
        is_active: true,
        csi_score: 70,
        hearts_collected: 0,
        correct_votes: 0,
        total_votes: 0,
        smile_taps: 0,
        customers_helped: 0,
      });
    }

    await supabase
      .from("game_state")
      .update({
        is_challenge_active: true,
        pending_challenge_title: null,
        pending_challenge_game_type: null,
        pending_challenge_team_id: null,
      })
      .eq("id", gameState.id);

    const pendingTeam = teams.find((t) => t.id === teamId);
    await supabase.from("news_ticker").insert({
      message: `🚀 ${pendingTeam?.name || "ทีม"} เริ่ม ${gameType} Challenge แล้ว!`,
      team_id: teamId,
    });

    toast.success(`🚀 เริ่ม ${gameType} Challenge แล้ว!`);
    setLoading(false);
  };

  const clearPendingChallenge = async () => {
    if (!gameState) return;
    setLoading(true);

    await supabase
      .from("game_state")
      .update({
        pending_challenge_title: null,
        pending_challenge_game_type: null,
        pending_challenge_team_id: null,
        challenge_type: null,
      })
      .eq("id", gameState.id);

    toast.info("ยกเลิก Pending Challenge แล้ว");
    setLoading(false);
  };

  const stopChallenge = async () => {
    if (!gameState) return;
    setLoading(true);

    await supabase.from("grow_plus_games").update({ is_active: false }).eq("is_active", true);
    await supabase.from("safe_act_games").update({ is_active: false }).eq("is_active", true);
    await supabase.from("pro_care_games").update({ is_active: false }).eq("is_active", true);

    await supabase
      .from("game_state")
      .update({
        is_challenge_active: false,
        challenge_type: null,
      })
      .eq("id", gameState.id);

    const currentTeam = getCurrentTeam();
    await supabase.from("news_ticker").insert({
      message: `🛑 ${currentTeam?.name || "ทีม"} หยุด Challenge แล้ว!`,
      team_id: currentTeam?.id,
    });

    toast.success("หยุด Challenge และบันทึกข้อมูลแล้ว!");
    setLoading(false);
  };

  const toggleChallenge = async () => {
    if (!gameState) return;
    setLoading(true);

    const { error } = await supabase
      .from("game_state")
      .update({ is_challenge_active: !gameState.is_challenge_active })
      .eq("id", gameState.id);

    if (!error) {
      toast.success(gameState.is_challenge_active ? "หยุด Challenge" : "🚀 เริ่ม Challenge!");

      if (!gameState.is_challenge_active) {
        const currentTeam = getCurrentTeam();
        await supabase.from("news_ticker").insert({
          message: `⚡ ${currentTeam?.name || "ทีม"} กำลังทำ Challenge!`,
          team_id: currentTeam?.id,
        });
      }
    }
    setLoading(false);
  };

  const nextTurn = async () => {
    if (!gameState) return;
    setLoading(true);

    const currentIndex = teams.findIndex((t) => t.id === gameState.current_turn_team_id);
    const nextIndex = (currentIndex + 1) % teams.length;
    const nextTeam = teams[nextIndex];

    const { error } = await supabase
      .from("game_state")
      .update({
        current_turn_team_id: nextTeam.id,
        is_dice_locked: true,
        is_challenge_active: false,
        last_dice_value: null,
      })
      .eq("id", gameState.id);

    if (!error) {
      toast.success(`ถึงตาของ ${nextTeam.name} แล้ว!`);
      await supabase.from("news_ticker").insert({
        message: `🎯 ถึงตาของ ${nextTeam.name} แล้ว!`,
        team_id: nextTeam.id,
      });
    }
    setLoading(false);
  };

  const startGame = async () => {
    if (!gameState || teams.length === 0) return;
    setLoading(true);

    const { error } = await supabase
      .from("game_state")
      .update({
        current_turn_team_id: teams[0].id,
        is_dice_locked: true,
        is_challenge_active: false,
      })
      .eq("id", gameState.id);

    if (!error) {
      toast.success("🎮 เริ่มเกมแล้ว!");
      await supabase.from("news_ticker").insert({
        message: "🏁 เกม Hospital Game of Life เริ่มต้นแล้ว!",
      });
    }
    setLoading(false);
  };

  const resetGame = async () => {
    if (!confirm("ต้องการรีเซ็ตเกมหรือไม่? คะแนนทั้งหมดจะหายไป")) return;
    setLoading(true);

    await supabase
      .from("teams")
      .update({
        current_tile: 0,
        revenue_score: 0,
        safety_score: 0,
        service_score: 0,
      })
      .neq("id", "");

    if (gameState) {
      await supabase
        .from("game_state")
        .update({
          current_turn_team_id: null,
          is_dice_locked: true,
          is_challenge_active: false,
          total_revenue: 0,
        })
        .eq("id", gameState.id);
    }

    await supabase.from("news_ticker").delete().neq("id", "");

    toast.success("รีเซ็ตเกมแล้ว");
    setLoading(false);
  };

  // amountMB -> convert to BAHT before save
  const addScoreToTeam = async (teamId: string, scoreType: "revenue" | "safety" | "service", amountMB: number) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const field = `${scoreType}_score` as keyof Team;
    const current = (team[field] as number) || 0;
    const addBaht = amountMB * MB_DIVISOR;

    await supabase
      .from("teams")
      .update({ [field]: current + addBaht })
      .eq("id", teamId);

    toast.success(`+${amountMB} MB ให้ ${team.name} (${scoreType})`);
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      {/* Header */}
      <header className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">ควบคุมเกม Hospital Game of Life</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Pages Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Admin Menu
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Pages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  <span>Game Control Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/players")} className="gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  <span>Player Management</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/database")} className="gap-2 cursor-pointer">
                  <Zap className="w-4 h-4" />
                  <span>Database Manager</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/stage")} className="gap-2 cursor-pointer">
                  <Play className="w-4 h-4" />
                  <span>Main Game Board</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/monitor")} className="gap-2 cursor-pointer">
                  <Target className="w-4 h-4" />
                  <span>Monitor Display</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/test-minigames")} className="gap-2 cursor-pointer">
                  <Zap className="w-4 h-4" />
                  <span>Test Mini-Games</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="px-4 py-2 rounded-lg bg-accent/20 text-accent font-display font-bold">
              <Target className="w-4 h-4 inline mr-2" />
              {formatMB(totalMoneyBaht, 1)} / {formatMB(targetBaht, 0)}
            </div>
            <div className="w-40 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Control Panel */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              ตาปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getCurrentTeam() ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getCurrentTeam()?.color }} />
                <span className="font-display font-bold text-lg">{getCurrentTeam()?.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">ยังไม่เริ่มเกม</span>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">สถานะลูกเต๋า</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={toggleDiceLock}
              disabled={loading || !gameState?.current_turn_team_id}
              variant={gameState?.is_dice_locked ? "destructive" : "default"}
              className="w-full"
            >
              {gameState?.is_dice_locked ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  ล็อคอยู่ - คลิกเพื่อปลด
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  ปลดล็อคแล้ว - คลิกเพื่อล็อค
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "glass-card",
            (gameState?.pending_challenge_title || gameState?.is_challenge_active) && "ring-2 ring-accent",
            gameState?.pending_challenge_title && !gameState?.is_challenge_active && "animate-pulse",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {gameState?.is_challenge_active
                ? "🎮 Challenge กำลังดำเนินอยู่"
                : gameState?.pending_challenge_title
                  ? "🎯 Pending Challenge"
                  : "Challenge"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gameState?.is_challenge_active ? (
              <>
                <div className="text-sm font-medium text-green-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Challenge กำลังดำเนินอยู่
                </div>
                <div className="text-xs text-muted-foreground">ประเภท: {gameState.challenge_type || "Unknown"}</div>
                <div className="text-xs text-muted-foreground">Team: {getCurrentTeam()?.name}</div>
                <Button onClick={stopChallenge} disabled={loading} variant="destructive" className="w-full">
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop & บันทึกข้อมูล
                </Button>
              </>
            ) : gameState?.pending_challenge_title ? (
              <>
                <div className="text-sm font-medium text-accent">{gameState.pending_challenge_title}</div>
                <div className="text-xs text-muted-foreground">
                  Game: {gameState.pending_challenge_game_type} ({gameState.challenge_type})
                </div>
                <div className="text-xs text-muted-foreground">
                  Team: {teams.find((t) => t.id === gameState.pending_challenge_team_id)?.name}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={startPendingChallenge}
                    disabled={loading}
                    className="flex-1 bg-strategy-grow hover:bg-strategy-grow/90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start!
                  </Button>
                  <Button onClick={clearPendingChallenge} disabled={loading} variant="outline" size="icon">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={toggleChallenge}
                disabled={loading || !gameState?.current_turn_team_id}
                className="w-full bg-strategy-grow hover:bg-strategy-grow/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                เริ่ม Challenge
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">📍 เคลื่อนไทล์</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!getCurrentTeam() ? (
              <p className="text-xs text-muted-foreground">เลือกทีมก่อน</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {getCurrentTeam()?.name} at Tile {getCurrentTeam()?.current_tile}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => getCurrentTeam() && moveTile(getCurrentTeam()!.id, 1)}
                    disabled={loading}
                    size="sm"
                    className="flex-1"
                  >
                    +1 Step
                  </Button>
                  <Button
                    onClick={() => getCurrentTeam() && moveTile(getCurrentTeam()!.id, 3)}
                    disabled={loading}
                    size="sm"
                    className="flex-1"
                  >
                    +3 Steps
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ควบคุมเกม</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {!gameState?.current_turn_team_id ? (
              <Button onClick={startGame} disabled={loading} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                เริ่มเกม
              </Button>
            ) : (
              <Button onClick={nextTurn} disabled={loading} className="flex-1">
                <SkipForward className="w-4 h-4 mr-2" />
                ตาถัดไป
              </Button>
            )}
            <Button onClick={resetGame} disabled={loading} variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monitor Display Control Panel */}
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            📺 Multi-Monitor Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((monitorNum) => (
              <div key={monitorNum} className="space-y-3 p-4 border border-border/30 rounded-lg bg-muted/10">
                <p className="font-semibold text-sm">Monitor {monitorNum}</p>
                
                <select 
                  defaultValue="board"
                  onChange={(e) => {
                    // Store selection in session for this monitor
                    sessionStorage.setItem(`monitor${monitorNum}View`, e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-muted/20 border border-border/30 text-foreground"
                >
                  <option value="board">Game Board</option>
                  <option value="score">Score Summary</option>
                  <option value="teams">Team Rankings</option>
                  <option value="turn">Current Turn</option>
                  {gameState?.pending_challenge_game_type && [
                    <option key="leaderboard" value="leaderboard">Game Leaderboard</option>,
                    <option key="activity" value="activity">Activity Feed</option>,
                  ]}
                </select>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const view = (document.querySelector(`select`) as HTMLSelectElement)?.value || 'board';
                    sessionStorage.setItem(`monitor${monitorNum}View`, view);
                    const minigame = gameState?.pending_challenge_game_type ? `&minigame=${gameState.pending_challenge_game_type}` : '';
                    window.open(`/monitor?monitor=${monitorNum}&view=${view}${minigame}`, `monitor${monitorNum}`, 'width=1920,height=1080');
                  }}
                >
                  📺 Open Full Screen
                </Button>
              </div>
            ))}
          </div>
          
          {gameState?.pending_challenge_game_type && (
            <div className="mt-4 p-3 bg-green-400/10 border border-green-400/30 rounded-lg">
              <p className="text-xs font-medium text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Mini-Game Active: {gameState.pending_challenge_game_type}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Use "Game Leaderboard" or "Activity Feed" views to display live player data on monitors.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {teams.map((team) => {
          const revenueBaht = team.revenue_score || 0;
          const safeBaht = team.safety_score || 0;
          const proBaht = team.service_score || 0;

          const safeProBaht = safeBaht + proBaht;
          const totalTeamBaht = revenueBaht + safeBaht + proBaht;

          return (
            <Card
              key={team.id}
              className={cn(
                "glass-card transition-all",
                gameState?.current_turn_team_id === team.id && "ring-2 ring-accent",
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-sm">{team.name}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Top numbers: Revenue MB + SafePro MB */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center py-2 rounded-lg bg-muted/20">
                    <div className="text-3xl font-display font-bold text-gradient">{toMB(revenueBaht).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Revenue (MB)</div>
                  </div>

                  <div className="text-center py-2 rounded-lg bg-muted/20">
                    <div className="text-3xl font-display font-bold text-foreground">
                      {toMB(safeProBaht).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">คะแนนรวม (Safe+Pro) (MB)</div>
                  </div>
                </div>

                {/* Total all (optional, but helps clarity) */}
                <div className="text-center -mt-1">
                  <div className="text-xs text-muted-foreground">Total (All) = {formatMB(totalTeamBaht, 1)}</div>
                </div>

                {/* Details (Baht) */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Grow+ (บาท):</span>
                    <span className="text-strategy-grow">{formatBaht(revenueBaht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safe Act (บาท):</span>
                    <span className="text-strategy-safe">{formatBaht(safeBaht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ProCare (บาท):</span>
                    <span className="text-strategy-care">{formatBaht(proBaht)}</span>
                  </div>
                </div>

                {/* Add score buttons (MB increments) */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => addScoreToTeam(team.id, "revenue", STEP_SMALL_MB)}
                  >
                    +{STEP_SMALL_MB}MB
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => addScoreToTeam(team.id, "revenue", STEP_LARGE_MB)}
                  >
                    +{STEP_LARGE_MB}MB
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">ช่องที่: {team.current_tile}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

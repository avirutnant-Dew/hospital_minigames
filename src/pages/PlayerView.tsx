import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DiceRoller } from "@/components/game/DiceRoller";
import { EmojiReactions } from "@/components/game/EmojiReactions";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { QRCodeDisplay } from "@/components/game/QRCodeDisplay";
import { MissionModal, Mission } from "@/components/game/MissionModal";
import { BonusModal } from "@/components/game/BonusModal";
import { GrowPlusController, GrowPlusGame } from "@/components/game/growplus";
import { SafeActController, SafeActGame } from "@/components/game/safeact";
import { ProCareController, ProCareGame } from "@/components/game/procare";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { User, Users, Dice6, Layers, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

// Board tile definitions (24 tiles)
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

interface Team {
  id: string;
  name: string;
  color: string;
}

interface GameState {
  current_turn_team_id: string | null;
  is_dice_locked: boolean;
  is_challenge_active: boolean;
}

interface ChallengeQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
}

export default function PlayerView() {
  const [searchParams] = useSearchParams();
  const [nickname, setNickname] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ChallengeQuestion | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [activeGrowPlusGame, setActiveGrowPlusGame] = useState<GrowPlusGame | null>(null);
  const [activeSafeActGame, setActiveSafeActGame] = useState<SafeActGame | null>(null);
  const [activeProCareGame, setActiveProCareGame] = useState<ProCareGame | null>(null);
  const [teamCaptains, setTeamCaptains] = useState<Record<string, boolean>>({});
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // New states for tile type handling
  const [currentTileType, setCurrentTileType] = useState<string | null>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [hasRolledDice, setHasRolledDice] = useState(false);

  // Shuffle bag states for mini-game randomization
  const [growPlusBag, setGrowPlusBag] = useState<string[]>([]);
  const [safeActBag, setSafeActBag] = useState<string[]>([]);
  const [proCareBag, setProCareBag] = useState<string[]>([]);

  // Check if this is my turn
  const isMyTurn = gameState?.current_turn_team_id === selectedTeam?.id;
  const canRollDice = isMyTurn && !gameState?.is_dice_locked && isCaptain;

  // Generate player join URL
  const playerJoinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/play`
    : "/play";

  // Helper function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to get next game from shuffle bag
  const getNextGame = (
    bag: string[],
    setBag: React.Dispatch<React.SetStateAction<string[]>>,
    allGames: string[]
  ): string => {
    let currentBag = bag;

    // If bag is empty, shuffle and refill
    if (currentBag.length === 0) {
      currentBag = shuffleArray(allGames);
    }

    // Take the first game from the bag
    const [nextGame, ...remainingBag] = currentBag;
    setBag(remainingBag);

    return nextGame;
  };

  // Load shuffle bags from localStorage on mount
  useEffect(() => {
    const savedBags = localStorage.getItem("game_shuffle_bags");
    if (savedBags) {
      try {
        const { growPlus, safeAct, proCare } = JSON.parse(savedBags);
        setGrowPlusBag(growPlus || []);
        setSafeActBag(safeAct || []);
        setProCareBag(proCare || []);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save shuffle bags to localStorage when they change
  useEffect(() => {
    localStorage.setItem("game_shuffle_bags", JSON.stringify({
      growPlus: growPlusBag,
      safeAct: safeActBag,
      proCare: proCareBag,
    }));
  }, [growPlusBag, safeActBag, proCareBag]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedSession = localStorage.getItem("player_session");
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // Validate session with database
          const { data: player } = await supabase
            .from("players")
            .select("*, teams(*)")
            .eq("session_id", session.sessionId)
            .maybeSingle();

          if (player && player.teams) {
            // Session valid - restore state
            setNickname(player.nickname);
            setSelectedTeam({
              id: player.team_id,
              name: (player.teams as Team).name,
              color: (player.teams as Team).color,
            });
            setIsCaptain(player.role === "CAPTAIN");
            setSessionId(session.sessionId);
            setIsJoined(true);
          } else {
            // Session expired - clear it
            localStorage.removeItem("player_session");
          }
        } catch {
          localStorage.removeItem("player_session");
        }
      }
      setIsCheckingSession(false);
    };
    checkSession();
  }, []);

  // Fetch captain status for each team (real-time)
  useEffect(() => {
    const fetchCaptainStatus = async () => {
      const { data: captains } = await supabase
        .from("players")
        .select("team_id")
        .eq("role", "CAPTAIN");

      if (captains) {
        const captainMap: Record<string, boolean> = {};
        captains.forEach((c) => {
          captainMap[c.team_id] = true;
        });
        setTeamCaptains(captainMap);
      }
    };
    fetchCaptainStatus();

    // Real-time subscription for captain changes
    const captainChannel = supabase
      .channel("captain-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          fetchCaptainStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(captainChannel);
    };
  }, []);

  // Fetch teams, game state, and subscribe to game_state changes (no team dependency)
  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase.from("teams").select("*").order("name");
      if (data) setTeams(data);
    };
    fetchTeams();

    const fetchGameState = async () => {
      const { data } = await supabase
        .from("game_state")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) setGameState(data);
    };
    fetchGameState();

    // Set captain from URL
    const captainParam = searchParams.get("captain");
    if (captainParam === "true") setIsCaptain(true);

    // Real-time subscription for game state only
    const gameStateChannel = supabase
      .channel("player-game-state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_state" },
        (payload) => {
          setGameState(payload.new as GameState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameStateChannel);
    };
  }, [searchParams]);

  // Reset dice state when turn changes
  useEffect(() => {
    setHasRolledDice(false);
  }, [gameState?.current_turn_team_id]);

  // Game subscriptions - separate useEffect with proper dependencies
  useEffect(() => {
    // Only subscribe after player has joined and selected a team
    if (!isJoined || !selectedTeam?.id) return;

    const teamId = selectedTeam.id;

    // Initial fetch - get any active games for this team
    const fetchActiveGames = async () => {
      const [growRes, safeRes, careRes] = await Promise.all([
        supabase.from("grow_plus_games").select("*").eq("team_id", teamId).eq("is_active", true).maybeSingle(),
        supabase.from("safe_act_games").select("*").eq("team_id", teamId).eq("is_active", true).maybeSingle(),
        supabase.from("pro_care_games").select("*").eq("team_id", teamId).eq("is_active", true).maybeSingle(),
      ]);
      if (growRes.data) setActiveGrowPlusGame(growRes.data as unknown as GrowPlusGame);
      if (safeRes.data) setActiveSafeActGame(safeRes.data as unknown as SafeActGame);
      if (careRes.data) setActiveProCareGame(careRes.data as unknown as ProCareGame);
    };
    fetchActiveGames();

    // Real-time subscription for games - now teamId is guaranteed to have a value
    const gamesChannel = supabase
      .channel(`team-games-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grow_plus_games" },
        (payload) => {
          const game = payload.new as GrowPlusGame;
          if (game.team_id !== teamId) return;
          if (game.is_active) {
            setActiveGrowPlusGame(game);
          } else {
            setActiveGrowPlusGame(null);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "safe_act_games" },
        (payload) => {
          const game = payload.new as SafeActGame;
          if (game.team_id !== teamId) return;
          if (game.is_active) {
            setActiveSafeActGame(game);
          } else {
            setActiveSafeActGame(null);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pro_care_games" },
        (payload) => {
          const game = payload.new as ProCareGame;
          if (game.team_id !== teamId) return;
          if (game.is_active) {
            setActiveProCareGame(game);
          } else {
            setActiveProCareGame(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gamesChannel);
    };
  }, [selectedTeam?.id, isJoined, gameState?.is_challenge_active]);

  const handleJoin = async () => {
    if (!nickname.trim() || !selectedTeam) {
      toast.error("กรุณากรอกชื่อและเลือกทีม");
      return;
    }

    // Force CREW if team already has a Captain
    const finalRole = isCaptain && !teamCaptains[selectedTeam.id] ? "CAPTAIN" : "CREW";
    const newSessionId = crypto.randomUUID();

    const { error } = await supabase.from("players").insert({
      nickname: nickname.trim(),
      team_id: selectedTeam.id,
      role: finalRole,
      session_id: newSessionId,
    });

    if (error) {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      return;
    }

    // Save session to localStorage
    localStorage.setItem(
      "player_session",
      JSON.stringify({
        nickname: nickname.trim(),
        teamId: selectedTeam.id,
        isCaptain: finalRole === "CAPTAIN",
        sessionId: newSessionId,
      })
    );

    setSessionId(newSessionId);
    setIsCaptain(finalRole === "CAPTAIN");
    setIsJoined(true);
    toast.success(
      `ยินดีต้อนรับ ${nickname}! เข้าร่วม ${selectedTeam.name} เป็น ${finalRole} แล้ว`
    );
  };

  const handleLeaveGame = async () => {
    if (!sessionId) return;

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      return;
    }

    // Clear localStorage
    localStorage.removeItem("player_session");

    // Reset state
    setIsJoined(false);
    setNickname("");
    setSelectedTeam(null);
    setIsCaptain(false);
    setSessionId(null);
    toast.success("ออกจากเกมแล้ว");
  };

  const handleDiceRoll = async (value: number) => {
    if (!selectedTeam) return;

    // Save dice value to game_state for MainStage sync
    await supabase
      .from("game_state")
      .update({ last_dice_value: value })
      .eq("current_turn_team_id", selectedTeam.id);

    // Update team position
    const { data: team } = await supabase
      .from("teams")
      .select("current_tile")
      .eq("id", selectedTeam.id)
      .single();

    if (team) {
      let newTile = team.current_tile + value;
      let completedLap = false;

      // Check if team reached or passed tile 23 (Goal)
      if (newTile >= 24) {
        completedLap = true;
        newTile = newTile % 24; // Reset to tile 0 and carry over extra steps
      }

      // Update team position
      await supabase
        .from("teams")
        .update({ current_tile: newTile })
        .eq("id", selectedTeam.id);

      // Store the tile type for handleDrawCard
      const landedTile = BOARD_TILES[newTile];
      setCurrentTileType(landedTile.type);

      if (completedLap) {
        // Award Completion Bonus of 50M
        const { data: currentTeam } = await supabase
          .from("teams")
          .select("revenue_score")
          .eq("id", selectedTeam.id)
          .single();

        if (currentTeam) {
          await supabase
            .from("teams")
            .update({ revenue_score: currentTeam.revenue_score + 50000000 })
            .eq("id", selectedTeam.id);
        }

        // Add completion news
        await supabase.from("news_ticker").insert({
          message: `🎉🏆 ${selectedTeam.name} ถึงเส้นชัย! ได้รับ Completion Bonus 50M และเริ่มรอบใหม่!`,
          team_id: selectedTeam.id,
        });

        toast.success(`🎉 ถึงเส้นชัย! ได้รับ Completion Bonus 50M และเริ่มรอบใหม่ที่ช่อง ${newTile}`);
      } else {
        // Add normal movement news
        await supabase.from("news_ticker").insert({
          message: `${selectedTeam.name} ทอยได้ ${value} เดินไปช่อง ${newTile} (${landedTile.label})!`,
          team_id: selectedTeam.id,
        });

        toast.success(`ทอยได้ ${value}! เดินไปช่อง ${newTile} (${landedTile.label})`);
      }

      // Mark that dice has been rolled - can now draw card
      setHasRolledDice(true);
    }
  };

  const handleDrawCard = async () => {
    if (!selectedTeam) return;

    if (currentTileType === "bonus") {
      // Bonus Tile: Random reward 10/20/30 MB
      const bonusOptions = [10000000, 20000000, 30000000];
      const randomBonus = bonusOptions[Math.floor(Math.random() * bonusOptions.length)];

      // Add to revenue_score
      const { data: team } = await supabase
        .from("teams")
        .select("revenue_score")
        .eq("id", selectedTeam.id)
        .single();

      if (team) {
        await supabase
          .from("teams")
          .update({ revenue_score: team.revenue_score + randomBonus })
          .eq("id", selectedTeam.id);
      }

      // Add news
      const bonusInMB = randomBonus / 1000000;
      await supabase.from("news_ticker").insert({
        message: `🎁 ${selectedTeam.name} ได้โบนัส ${bonusInMB}M บาท!`,
        team_id: selectedTeam.id,
      });

      // Show bonus modal
      setBonusAmount(randomBonus);
      setShowBonusModal(true);

      // Reset dice state after action
      setHasRolledDice(false);

    } else if (currentTileType === "challenge") {
      // Challenge Tile: Fetch random question from database
      const { data: questions } = await supabase
        .from("challenge_questions")
        .select("*");

      if (questions && questions.length > 0) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

        // Parse options from JSON
        let optionsArray: string[] = [];
        if (Array.isArray(randomQuestion.options)) {
          optionsArray = randomQuestion.options as string[];
        } else if (typeof randomQuestion.options === "object" && randomQuestion.options !== null) {
          optionsArray = Object.values(randomQuestion.options as Record<string, string>);
        }

        setCurrentQuestion({
          id: randomQuestion.id,
          category: randomQuestion.category,
          question: randomQuestion.question,
          options: optionsArray,
          correct_answer: randomQuestion.correct_answer || "",
          points: randomQuestion.points,
        });

        // Add news
        await supabase.from("news_ticker").insert({
          message: `❓ ${selectedTeam.name} ได้รับคำถาม Challenge!`,
          team_id: selectedTeam.id,
        });

        // Reset dice state after action
        setHasRolledDice(false);
      } else {
        toast.error("ไม่พบคำถามในระบบ");
      }

    } else {
      // grow, safe, care tiles: Open Mission Modal (filtered by tile type)
      setShowMissionModal(true);

      // Reset dice state after action
      setHasRolledDice(false);
    }
  };

  const handleStartChallenge = async (mission: Mission) => {
    // Validate team selection first
    if (!selectedTeam) {
      toast.error("กรุณาเลือกทีมก่อน");
      return;
    }

    setCurrentMission(mission);
    setShowMissionModal(false);

    // Determine game type based on category
    let gameType = "";

    // Use suggested game type from mission if available (Fixed mapping)
    if (mission.suggestedGameType) {
      gameType = mission.suggestedGameType;
    } else {
      // Fallback to random shuffle bag system
      if (mission.category === "GROW_PLUS") {
        gameType = getNextGame(
          growPlusBag,
          setGrowPlusBag,
          ["REVENUE_TAP", "SBU_COMBO", "REFERRAL_LINK", "HOSPITAL_NETWORK", "DEPARTMENT_EFFICIENCY"]
        );
      } else if (mission.category === "SAFE_ACT") {
        gameType = getNextGame(
          safeActBag,
          setSafeActBag,
          ["HAZARD_POPPER", "RISK_DEFENDER", "CRITICAL_SYNC"]
        );
      } else if (mission.category === "PRO_CARE") {
        gameType = getNextGame(
          proCareBag,
          setProCareBag,
          ["HEART_COLLECTOR", "EMPATHY_ECHO", "SMILE_SPARKLE"]
        );
      }
    }

    // Fetch current game_state id first
    const { data: currentGameState } = await supabase
      .from("game_state")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!currentGameState) {
      toast.error("ไม่พบข้อมูล game state");
      return;
    }

    // Save pending challenge to game_state - wait for Admin to start
    const { error } = await supabase
      .from("game_state")
      .update({
        pending_challenge_title: mission.title,
        pending_challenge_game_type: gameType,
        pending_challenge_team_id: selectedTeam.id,
        challenge_type: mission.category,
      })
      .eq("id", currentGameState.id);

    if (error) {
      console.error("Error saving pending challenge:", error);
      toast.error("เกิดข้อผิดพลาด: " + error.message);
      return;
    }

    // Add news
    await supabase.from("news_ticker").insert({
      message: `🎯 ${selectedTeam.name} สุ่มได้ภารกิจ "${mission.title}" (${gameType}) - รอ Admin กด Start!`,
      team_id: selectedTeam.id,
    });

    toast.success(`สุ่มได้: ${mission.title} (${gameType}) - รอ Admin กด Start Challenge!`);
  };

  const handleChallengeAnswer = async (isCorrect: boolean, points: number) => {
    if (!selectedTeam) return;

    if (isCorrect) {
      // Convert points to money: 1 point = 1,000,000 Baht (1M)
      const moneyValue = points * 1_000_000;

      // Update team score with money value
      const { data: team } = await supabase
        .from("teams")
        .select("revenue_score")
        .eq("id", selectedTeam.id)
        .single();

      if (team) {
        await supabase
          .from("teams")
          .update({ revenue_score: team.revenue_score + moneyValue })
          .eq("id", selectedTeam.id);
      }

      // Add news with money format
      const moneyDisplay = (moneyValue / 1_000_000).toFixed(0);
      await supabase.from("news_ticker").insert({
        message: `🎉 ${selectedTeam.name} ตอบถูก! ได้ ${moneyDisplay}M บาท`,
        team_id: selectedTeam.id,
      });
    } else {
      // Add news for wrong answer
      await supabase.from("news_ticker").insert({
        message: `😅 ${selectedTeam.name} ตอบผิด! ลองใหม่รอบหน้า`,
        team_id: selectedTeam.id,
      });
    }

    setCurrentQuestion(null);
  };

  // Loading screen while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-accent animate-spin" />
          <p className="text-muted-foreground">กำลังตรวจสอบ session...</p>
        </div>
      </div>
    );
  }

  // Join Screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md space-y-6 animate-fade-in-up">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-gradient mb-2">
              Hospital Game of Life
            </h1>
            <p className="text-muted-foreground">เข้าร่วมเกม</p>
          </div>

          {/* QR Code Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQRCode(!showQRCode)}
              className="gap-2"
            >
              <Layers className="w-4 h-4" />
              {showQRCode ? "ซ่อน QR Code" : "แสดง QR Code"}
            </Button>
          </div>

          {showQRCode && (
            <QRCodeDisplay
              url={playerJoinUrl}
              title="สแกนเพื่อเข้าร่วมเกม"
              size={150}
            />
          )}

          {/* Nickname Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              ชื่อเล่น
            </label>
            <Input
              placeholder="ใส่ชื่อเล่นของคุณ"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              เลือกทีม
            </label>
            <div className="grid grid-cols-1 gap-2">
              {teams.map((team) => (
                <Button
                  key={team.id}
                  variant="outline"
                  onClick={() => setSelectedTeam(team)}
                  className={cn(
                    "h-14 justify-start gap-3 transition-all",
                    selectedTeam?.id === team.id && "ring-2 ring-offset-2 ring-offset-background"
                  )}
                  style={{
                    borderColor: team.color,
                    color: selectedTeam?.id === team.id ? team.color : undefined,
                    backgroundColor: selectedTeam?.id === team.id ? `${team.color}20` : undefined,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-semibold">{team.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Captain Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <input
              type="checkbox"
              id="captain"
              checked={isCaptain}
              onChange={(e) => setIsCaptain(e.target.checked)}
              disabled={!!(selectedTeam && teamCaptains[selectedTeam.id])}
              className="w-5 h-5 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="captain"
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                selectedTeam && teamCaptains[selectedTeam.id] && "opacity-50 cursor-not-allowed"
              )}
            >
              <Dice6 className="w-5 h-5 text-accent" />
              <span className="font-medium">
                {selectedTeam && teamCaptains[selectedTeam.id]
                  ? "ทีมนี้มี Captain แล้ว (เข้าเป็น Crew)"
                  : "ฉันเป็น Captain (ทอยลูกเต๋า)"}
              </span>
            </label>
          </div>

          {/* Join Button */}
          <Button
            size="lg"
            onClick={handleJoin}
            disabled={!nickname.trim() || !selectedTeam}
            className="w-full h-14 text-lg font-display font-bold bg-gradient-to-r from-primary to-secondary"
          >
            เข้าร่วมเกม
          </Button>
        </div>
      </div>
    );
  }

  // Game View
  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="glass-card p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: selectedTeam?.color }}
          >
            {nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{nickname}</p>
            <p className="text-sm text-muted-foreground">
              {selectedTeam?.name} • {isCaptain ? "Captain 🎖️" : "Crew"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-4 py-2 rounded-full font-display text-sm font-bold",
              isMyTurn ? "bg-accent/20 text-accent animate-pulse" : "bg-muted text-muted-foreground"
            )}
          >
            {isMyTurn ? "🎯 ตาของคุณ!" : "👀 รอตา..."}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLeaveGame}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="ออกจากเกม"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto space-y-6">
        {/* GROW PLUS Game */}
        {activeGrowPlusGame && (
          <div className="glass-card p-4">
            <GrowPlusController
              teamId={selectedTeam?.id}
              playerNickname={nickname}
              isMainStage={false}
              initialGame={activeGrowPlusGame}
              onGameEnd={(score) => {
                toast.success(`เกมจบแล้ว! ได้ ${(score / 1000000).toFixed(1)}M`);
                setActiveGrowPlusGame(null);
              }}
            />
          </div>
        )}

        {/* SAFE ACT Game */}
        {activeSafeActGame && !activeGrowPlusGame && (
          <div className="glass-card p-4">
            <SafeActController
              teamId={selectedTeam?.id}
              playerNickname={nickname}
              isMainStage={false}
              initialGame={activeSafeActGame}
              onGameEnd={(shieldHealth) => {
                toast.success(`เกมจบแล้ว! Shield: ${shieldHealth}%`);
                setActiveSafeActGame(null);
              }}
            />
          </div>
        )}

        {/* PRO CARE Game */}
        {activeProCareGame && !activeGrowPlusGame && !activeSafeActGame && (
          <div className="glass-card p-4">
            <ProCareController
              teamId={selectedTeam?.id}
              playerNickname={nickname}
              isMainStage={false}
              initialGame={activeProCareGame}
              onGameEnd={(csiScore) => {
                toast.success(`เกมจบแล้ว! CSI Score: ${csiScore}%`);
                setActiveProCareGame(null);
              }}
            />
          </div>
        )}

        {/* Challenge Card */}
        {currentQuestion && !activeGrowPlusGame && !activeSafeActGame && !activeProCareGame && (
          <ChallengeCard
            question={currentQuestion}
            onAnswer={handleChallengeAnswer}
          />
        )}

        {/* CAPTAIN View */}
        {isCaptain && isMyTurn && !currentQuestion && !activeGrowPlusGame && !activeSafeActGame && !activeProCareGame && (
          <div className="glass-card p-8 space-y-6">
            <h2 className="text-xl font-display font-bold text-center">
              🎖️ Captain Controls
            </h2>

            {/* Dice Roller */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">🎲 ทอยลูกเต๋า</h3>
              <DiceRoller
                onRoll={handleDiceRoll}
                disabled={gameState?.is_dice_locked}
              />
            </div>

            {/* Draw Card Button */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-lg font-semibold text-center">📋 เปิดการ์ดภารกิจ</h3>
              <Button
                size="lg"
                onClick={handleDrawCard}
                disabled={!hasRolledDice}
                className={cn(
                  "w-full h-14 text-lg font-display font-bold gap-2",
                  hasRolledDice
                    ? "bg-gradient-to-r from-strategy-grow to-strategy-care"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Layers className="w-6 h-6" />
                {hasRolledDice ? "Draw Card" : "🎲 ทอยลูกเต๋าก่อน"}
              </Button>
            </div>
          </div>
        )}

        {/* CREW View - Waiting Screen */}
        {!isCaptain && isMyTurn && !currentQuestion && !activeGrowPlusGame && !activeSafeActGame && !activeProCareGame && (
          <div className="glass-card p-8 text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-accent animate-spin" />
              <h2 className="text-xl font-display font-bold">
                รอ Captain สั่งการ...
              </h2>
              <p className="text-muted-foreground">
                Waiting for Captain to move...
              </p>
            </div>

            {/* Floating Emoji Bar for Crew */}
            <div className="pt-6 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                ส่งกำลังใจให้ทีม! 💪
              </p>
              <EmojiReactions
                teamId={selectedTeam?.id}
                playerNickname={nickname}
                showButtons={true}
              />
            </div>
          </div>
        )}

        {/* Spectator View (Not My Turn) */}
        {!isMyTurn && !currentQuestion && !activeGrowPlusGame && !activeSafeActGame && !activeProCareGame && (
          <div className="glass-card p-8 text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl animate-bounce-soft">👀</div>
              <h2 className="text-xl font-display font-bold">
                โหมดเชียร์
              </h2>
              <p className="text-muted-foreground">
                ส่งกำลังใจให้ทีมอื่น!
              </p>
            </div>

            {/* Emoji Reactions for Spectators */}
            <div className="pt-6 border-t border-border/50">
              <EmojiReactions
                teamId={selectedTeam?.id}
                playerNickname={nickname}
                showButtons={true}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Emoji Reactions (Always Visible for Non-Captains) */}
      {!isCaptain && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="glass-card px-4 py-3 shadow-xl">
            <EmojiReactions
              teamId={selectedTeam?.id}
              playerNickname={nickname}
              showButtons={true}
            />
          </div>
        </div>
      )}

      {/* Mission Modal */}
      <MissionModal
        open={showMissionModal}
        onOpenChange={setShowMissionModal}
        onStartChallenge={handleStartChallenge}
        isCaptainOrAdmin={isCaptain}
        tileType={currentTileType}
      />

      {/* Bonus Modal */}
      <BonusModal
        open={showBonusModal}
        onOpenChange={setShowBonusModal}
        amount={bonusAmount}
        teamName={selectedTeam?.name}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-1/4 left-0 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: selectedTeam?.color }}
        />
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GAME_CONFIG } from './types';
import { Coins, Sparkles, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect } from '@/components/game/effects/VisualEffects';

interface RevenueTapGameProps {
  onTap: () => void;
  totalScore: number;
  timeRemaining: number;
  isActive: boolean;
  gameId?: string;
  playerNickname?: string;
  playerCount?: number;
}

export function RevenueTapGame({ 
  onTap, 
  totalScore, 
  timeRemaining, 
  isActive,
  gameId,
  playerNickname,
  playerCount = 0 
}: RevenueTapGameProps) {
  const [tapEffect, setTapEffect] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [topPlayers, setTopPlayers] = useState<Array<{nickname: string; score: number}>>([]);
  const [milestoneReached, setMilestoneReached] = useState(false);
  const [showMilestoneEffect, setShowMilestoneEffect] = useState(false);
  const lastMilestoneRef = useRef(0);
  
  const targetRevenue = GAME_CONFIG.REVENUE_TAP.targetRevenue;
  const progressPercent = Math.min((totalScore / targetRevenue) * 100, 100);
  const scorePerTap = GAME_CONFIG.REVENUE_TAP.scorePerAction;
  const MILESTONE = 25000000; // 25M THB milestone

  const handleTap = useCallback(() => {
    if (!isActive) return;
    
    setTapEffect(true);
    setTapCount((prev) => prev + 1);
    gameAudio.playTap(); // Add tap sound
    onTap();
    
    setTimeout(() => setTapEffect(false), 150);
  }, [isActive, onTap]);

  // Detect milestone celebrations
  useEffect(() => {
    const currentMilestones = Math.floor(totalScore / MILESTONE);
    if (currentMilestones > lastMilestoneRef.current) {
      lastMilestoneRef.current = currentMilestones;
      setShowMilestoneEffect(true);
      gameAudio.playMilestoneFanfare();
      
      setTimeout(() => setShowMilestoneEffect(false), 600);
    }
  }, [totalScore]);

  // Fetch top players every 2 seconds
  useEffect(() => {
    if (!gameId) return;

    const fetchTopPlayers = async () => {
      const { data } = await supabase
        .from('grow_plus_scores')
        .select('player_nickname, score_value')
        .eq('game_id', gameId);

      if (data) {
        const aggregated = data.reduce((acc, curr) => {
          const existing = acc.find(p => p.nickname === curr.player_nickname);
          if (existing) {
            existing.score += curr.score_value;
          } else {
            acc.push({ nickname: curr.player_nickname, score: curr.score_value });
          }
          return acc;
        }, [] as Array<{nickname: string; score: number}>);

        setTopPlayers(aggregated.sort((a, b) => b.score - a.score).slice(0, 5));
      }
    };

    fetchTopPlayers();
    const interval = setInterval(fetchTopPlayers, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4 min-h-screen relative">
      {/* Milestone Celebration Effect */}
      {showMilestoneEffect && (
        <>
          <div className="fixed inset-0 pointer-events-none">
            <ParticleEffect trigger={true} type="victory" />
          </div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-display font-bold animate-milestone-burst text-accent pointer-events-none">
            🎉 MILESTONE! 🎉
          </div>
        </>
      )}

      {/* Player Count Badge */}
      {playerCount > 0 && (
        <div className="absolute top-4 right-4 glass-card px-3 py-1 rounded-full text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          {playerCount}/30 players
        </div>
      )}

      {/* Timer */}
      <div className="text-center">
        <div className={cn(
          "text-6xl font-display font-bold animate-pulse",
          timeRemaining <= 10 ? "text-destructive" : "text-gradient"
        )}>
          {timeRemaining}s
        </div>
        <p className="text-muted-foreground mt-2">เหลือเวลา</p>
      </div>

      {/* Golden Tap Button */}
      <button
        onClick={handleTap}
        disabled={!isActive}
        className={cn(
          "relative w-48 h-48 rounded-full",
          "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600",
          "shadow-[0_0_60px_rgba(251,191,36,0.5)]",
          "hover:shadow-[0_0_80px_rgba(251,191,36,0.7)]",
          "active:scale-95 transition-all duration-100",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "animate-fade-in-up",
          tapEffect && "animate-ping-once scale-110 shadow-[0_0_100px_rgba(251,191,36,0.9)]"
        )}
      >
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center">
          <Coins className="w-20 h-20 text-amber-900" />
        </div>
        
        {/* Sparkle effects */}
        {tapEffect && (
          <>
            <Sparkles className="absolute -top-4 left-1/2 w-8 h-8 text-yellow-300 animate-ping" />
            <Sparkles className="absolute -bottom-4 right-0 w-6 h-6 text-yellow-300 animate-ping" />
            <Sparkles className="absolute top-0 -left-4 w-6 h-6 text-yellow-300 animate-ping" />
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-lg font-semibold">แตะเพื่อเพิ่มรายได้!</p>
        <p className="text-sm text-muted-foreground">+{formatRevenue(scorePerTap)} ต่อครั้ง</p>
        <p className="text-xs text-accent mt-1">คุณแตะแล้ว {tapCount} ครั้ง</p>
      </div>

      {/* Team Score Display */}
      <div className="glass-card p-4 rounded-lg text-center w-full max-w-xs">
        <p className="text-muted-foreground text-sm">รายได้ทีม</p>
        <p className="text-3xl font-display font-bold text-gradient">{formatRevenue(totalScore)}</p>
      </div>

      {/* Top Players Leaderboard */}
      {topPlayers.length > 0 && (
        <div className="glass-card p-4 rounded-lg w-full max-w-xs">
          <p className="text-sm font-semibold mb-3">Top Contributors</p>
          <div className="space-y-2">
            {topPlayers.map((player, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}</span>
                  <span className={playerNickname === player.nickname ? 'font-bold text-accent' : ''}>{player.nickname}</span>
                </span>
                <span className="text-accent">{formatRevenue(player.score)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Stage Display Component
export function RevenueTapMainDisplay({ totalScore, timeRemaining }: { totalScore: number; timeRemaining: number }) {
  const targetRevenue = GAME_CONFIG.REVENUE_TAP.targetRevenue;
  const progressPercent = Math.min((totalScore / targetRevenue) * 100, 100);

  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toLocaleString();
  };

  return (
    <div className="glass-card p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-gradient">
          💰 Revenue Tap Challenge
        </h2>
        <p className="text-muted-foreground">The Power of 30 - ร่วมกันแตะเพื่อเป้าหมาย!</p>
      </div>

      {/* Timer */}
      <div className="flex justify-center">
        <div className={cn(
          "text-7xl font-display font-bold",
          timeRemaining <= 10 ? "text-destructive animate-pulse" : "text-gradient"
        )}>
          {timeRemaining}s
        </div>
      </div>

      {/* Revenue Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>รายได้รวม</span>
          <span className="font-bold text-accent">{formatRevenue(totalScore)}</span>
        </div>
        
        <div className="relative h-16 bg-muted/30 rounded-full overflow-hidden border-2 border-amber-500/30">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30" />
            {progressPercent > 5 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Coins className="w-8 h-8 text-amber-900 animate-bounce" />
              </div>
            )}
          </div>
          
          {/* Target marker */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
            🎯 {formatRevenue(targetRevenue)}
          </div>
        </div>

        <div className="text-center">
          <span className="text-4xl font-display font-bold text-gradient">
            {progressPercent.toFixed(1)}%
          </span>
          <p className="text-sm text-muted-foreground">ของเป้าหมาย 1.15B</p>
        </div>
      </div>
    </div>
  );
}

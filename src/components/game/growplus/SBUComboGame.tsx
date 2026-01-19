import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { GAME_CONFIG, SBU_ZONES, SBUZone } from './types';
import { Heart, Stethoscope, Bone, ClipboardCheck, Zap } from 'lucide-react';

interface SBUComboGameProps {
  onBoost: (zone: SBUZone) => void;
  currentZone: SBUZone;
  targetZone: SBUZone;
  timeRemaining: number;
  isActive: boolean;
  lastComboSuccess: boolean;
}

const ZONE_ICONS: Record<SBUZone, React.ReactNode> = {
  'Heart': <Heart className="w-8 h-8" />,
  'GI': <Stethoscope className="w-8 h-8" />,
  'Ortho': <Bone className="w-8 h-8" />,
  'Check-up': <ClipboardCheck className="w-8 h-8" />,
};

const ZONE_COLORS: Record<SBUZone, string> = {
  'Heart': 'from-red-500 to-pink-500',
  'GI': 'from-purple-500 to-violet-500',
  'Ortho': 'from-blue-500 to-cyan-500',
  'Check-up': 'from-green-500 to-emerald-500',
};

export function SBUComboGame({ 
  onBoost, 
  currentZone, 
  targetZone, 
  timeRemaining, 
  isActive,
  lastComboSuccess 
}: SBUComboGameProps) {
  const [tapped, setTapped] = useState(false);
  const isTargetMatch = currentZone === targetZone;

  const handleBoost = useCallback(() => {
    if (!isActive || tapped) return;
    
    setTapped(true);
    onBoost(currentZone);
    
    setTimeout(() => setTapped(false), 500);
  }, [isActive, tapped, currentZone, onBoost]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Timer */}
      <div className="text-center">
        <div className={cn(
          "text-5xl font-display font-bold",
          timeRemaining <= 10 ? "text-destructive animate-pulse" : "text-gradient"
        )}>
          {timeRemaining}s
        </div>
      </div>

      {/* Target Zone Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">เป้าหมาย SBU</p>
        <div className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-full",
          "bg-gradient-to-r",
          ZONE_COLORS[targetZone],
          "text-white font-display font-bold text-xl"
        )}>
          {ZONE_ICONS[targetZone]}
          {targetZone}
        </div>
      </div>

      {/* Current Zone Display */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">Zone ปัจจุบัน</p>
        <div className={cn(
          "text-2xl font-bold transition-colors duration-200",
          isTargetMatch ? "text-accent animate-pulse" : "text-muted-foreground"
        )}>
          {currentZone}
        </div>
      </div>

      {/* BOOST Button */}
      <button
        onClick={handleBoost}
        disabled={!isActive}
        className={cn(
          "relative w-40 h-40 rounded-full",
          "bg-gradient-to-br",
          ZONE_COLORS[currentZone],
          "shadow-lg hover:shadow-xl",
          "active:scale-95 transition-all duration-100",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          tapped && "ring-4 ring-white ring-opacity-50 scale-110"
        )}
      >
        <div className="absolute inset-4 rounded-full bg-white/20 flex items-center justify-center flex-col gap-2">
          <Zap className="w-12 h-12 text-white" />
          <span className="text-xl font-display font-bold text-white">BOOST</span>
        </div>
      </button>

      {/* Combo Feedback */}
      {lastComboSuccess && (
        <div className="animate-bounce text-center">
          <div className="text-3xl font-display font-bold text-accent">
            🎉 COMBO x5! 🎉
          </div>
          <p className="text-sm text-muted-foreground">20+ players synced!</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        กดเมื่อ Zone ตรงกับเป้าหมาย!
      </p>
    </div>
  );
}

// Main Stage Display
export function SBUComboMainDisplay({ 
  currentZone,
  targetZone,
  timeRemaining,
  totalScore,
  syncCount,
  comboActive,
}: { 
  currentZone: SBUZone;
  targetZone: SBUZone;
  timeRemaining: number;
  totalScore: number;
  syncCount: number;
  comboActive: boolean;
}) {
  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    return value.toLocaleString();
  };

  return (
    <div className="glass-card p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-gradient">
          ⚡ SBU Combo Rush
        </h2>
        <p className="text-muted-foreground">Sync Timing - รวมพลังทีม 20+ คน!</p>
      </div>

      <div className="flex justify-center">
        <div className={cn(
          "text-7xl font-display font-bold",
          timeRemaining <= 10 ? "text-destructive animate-pulse" : "text-gradient"
        )}>
          {timeRemaining}s
        </div>
      </div>

      {/* SBU Zone Highlight Bar */}
      <div className="grid grid-cols-4 gap-2">
        {SBU_ZONES.map((zone) => (
          <div
            key={zone}
            className={cn(
              "p-4 rounded-xl text-center transition-all duration-200",
              currentZone === zone && "ring-4 ring-white scale-105",
              zone === targetZone && "ring-2 ring-accent",
              `bg-gradient-to-br ${ZONE_COLORS[zone]}`
            )}
          >
            <div className="flex justify-center text-white mb-2">
              {ZONE_ICONS[zone]}
            </div>
            <p className="text-sm font-bold text-white">{zone}</p>
            {zone === targetZone && (
              <p className="text-xs text-white/80">🎯 TARGET</p>
            )}
          </div>
        ))}
      </div>

      {/* Combo Indicator */}
      {comboActive && (
        <div className="text-center animate-pulse">
          <div className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-accent to-primary">
            <span className="text-4xl font-display font-bold text-white">
              🔥 COMBO x5 ACTIVE! 🔥
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-primary/10">
          <div className="text-3xl font-display font-bold text-primary">{syncCount}</div>
          <p className="text-sm text-muted-foreground">Players Synced</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/10">
          <div className="text-3xl font-display font-bold text-accent">
            {syncCount >= 20 ? '✓' : `${20 - syncCount}`}
          </div>
          <p className="text-sm text-muted-foreground">
            {syncCount >= 20 ? 'Combo Ready!' : 'Need More'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-strategy-grow/10">
          <div className="text-3xl font-display font-bold text-strategy-grow">
            {formatRevenue(totalScore)}
          </div>
          <p className="text-sm text-muted-foreground">Revenue</p>
        </div>
      </div>
    </div>
  );
}

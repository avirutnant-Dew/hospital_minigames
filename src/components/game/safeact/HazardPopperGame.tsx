import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { HAZARD_ZONES, Hazard, SAFE_ACT_CONFIG } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect, GoldenGlow } from '@/components/game/effects';

interface HazardPopperGameProps {
  onTapHazard: (zoneId: number) => void;
  hazards: Hazard[];
  timeRemaining: number;
  isActive: boolean;
  hazardsCleared: number;
}

export function HazardPopperGame({ 
  onTapHazard, 
  hazards, 
  timeRemaining, 
  isActive,
  hazardsCleared 
}: HazardPopperGameProps) {
  const [tapFeedback, setTapFeedback] = useState<number | null>(null);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [prevHazardsCleared, setPrevHazardsCleared] = useState(hazardsCleared);

  // Play success sound when hazard is cleared
  useEffect(() => {
    if (hazardsCleared > prevHazardsCleared) {
      gameAudio.playHazardPop();
      setParticleTrigger(p => p + 1);
    }
    setPrevHazardsCleared(hazardsCleared);
  }, [hazardsCleared, prevHazardsCleared]);

  const handleTap = (zoneId: number) => {
    if (!isActive) return;
    const hazard = hazards.find(h => h.zoneId === zoneId && !h.isCleared);
    if (!hazard) return;

    setTapFeedback(zoneId);
    gameAudio.playTap();
    onTapHazard(zoneId);
    setTimeout(() => setTapFeedback(null), 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHazardForZone = (zoneId: number): Hazard | undefined => {
    return hazards.find(h => h.zoneId === zoneId && !h.isCleared);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <span className="text-xl font-bold">{hazardsCleared}</span>
        </div>
        <div className={cn(
          "text-3xl font-bold font-display",
          timeRemaining <= 10 && "text-red-400 animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Hospital Map Grid */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-md">
        {HAZARD_ZONES.map((zone) => {
          const hazard = getHazardForZone(zone.id);
          const progress = hazard ? (hazard.currentTaps / hazard.tapsRequired) * 100 : 0;
          
          return (
            <button
              key={zone.id}
              onClick={() => handleTap(zone.id)}
              disabled={!isActive || !hazard}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all",
                "border-2 relative overflow-hidden",
                hazard 
                  ? "bg-red-500/30 border-red-500 active:scale-95 animate-pulse" 
                  : "bg-green-500/10 border-green-500/30",
                tapFeedback === zone.id && "scale-90"
              )}
            >
              {/* Progress Fill */}
              {hazard && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-green-500/50 transition-all duration-100"
                  style={{ height: `${progress}%` }}
                />
              )}
              
              {/* Zone Content */}
              <div className="relative z-10">
                {hazard ? (
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400/50" />
                )}
                <span className="text-xs mt-1 font-medium">{zone.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Instructions */}
      <p className="text-center text-muted-foreground text-sm">
        กดรัวๆ ที่โซนสีแดงเพื่อกำจัดจุดเสี่ยง!
      </p>
    </div>
  );
}

// Main Display Component
interface HazardPopperMainDisplayProps {
  hazards: Hazard[];
  timeRemaining: number;
  hazardsCleared: number;
  totalHazards: number;
  isComplete: boolean;
}

export function HazardPopperMainDisplay({ 
  hazards, 
  timeRemaining, 
  hazardsCleared,
  totalHazards,
  isComplete
}: HazardPopperMainDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHazardForZone = (zoneId: number): Hazard | undefined => {
    return hazards.find(h => h.zoneId === zoneId && !h.isCleared);
  };

  const clearProgress = (hazardsCleared / Math.max(1, totalHazards)) * 100;

  return (
    <div className={cn(
      "relative w-full min-h-[60vh] flex flex-col items-center justify-center p-8 transition-all duration-500",
      isComplete && "bg-green-500/10"
    )}>
      {/* Success Overlay */}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-br from-green-500/30 to-yellow-500/20">
          <div className="text-center">
            <Sparkles className="w-32 h-32 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-6xl font-bold text-gradient font-display">ZERO AE!</h2>
            <p className="text-2xl text-green-400 mt-2">All hazards cleared!</p>
          </div>
        </div>
      )}

      {/* Timer and Progress */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-8">
        <div className="text-center">
          <div className={cn(
            "text-5xl font-bold font-display",
            timeRemaining <= 10 && "text-red-400 animate-pulse"
          )}>
            {formatTime(timeRemaining)}
          </div>
          <div className="text-muted-foreground">Time</div>
        </div>
        
        <div className="text-center">
          <div className="text-5xl font-bold font-display text-green-400">
            {hazardsCleared} / {totalHazards}
          </div>
          <div className="text-muted-foreground">Hazards Cleared</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl mb-8">
        <div className="h-6 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all duration-300"
            style={{ width: `${clearProgress}%` }}
          />
        </div>
      </div>

      {/* Hospital Map - Large Version */}
      <div className="glass-card p-8 w-full max-w-4xl">
        <h3 className="text-2xl font-display font-bold text-center mb-6">
          🏥 PRINC Paknampo Hospital Map
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          {HAZARD_ZONES.map((zone) => {
            const hazard = getHazardForZone(zone.id);
            const progress = hazard ? (hazard.currentTaps / hazard.tapsRequired) * 100 : 0;
            
            return (
              <div
                key={zone.id}
                className={cn(
                  "aspect-video rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300",
                  "border-3 relative overflow-hidden",
                  hazard 
                    ? "bg-red-500/30 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                    : "bg-green-500/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                )}
              >
                {/* Progress Fill */}
                {hazard && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-green-500/50 transition-all duration-100"
                    style={{ height: `${progress}%` }}
                  />
                )}
                
                {/* Zone Content */}
                <div className="relative z-10 text-center">
                  {hazard ? (
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
                  ) : (
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                  )}
                  <span className="text-lg font-bold mt-2 block">{zone.name}</span>
                  {hazard && (
                    <span className="text-sm text-red-300">
                      {hazard.currentTaps}/{hazard.tapsRequired} taps
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

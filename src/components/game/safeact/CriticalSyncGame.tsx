import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Heart, AlertTriangle } from 'lucide-react';
import { SAFE_ACT_CONFIG } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { PulseRing } from '@/components/game/effects';

interface CriticalSyncGameProps {
  onTap: () => void;
  ekgValue: number;
  timeRemaining: number;
  isActive: boolean;
  isInSafeZone: boolean;
}

export function CriticalSyncGame({ onTap, ekgValue, timeRemaining, isActive, isInSafeZone }: CriticalSyncGameProps) {
  const [tapFeedback, setTapFeedback] = useState(false);
  const [prevIsInSafeZone, setPrevIsInSafeZone] = useState(isInSafeZone);

  // Heartbeat audio based on state
  useEffect(() => {
    if (isActive) {
      const bpm = isInSafeZone ? 70 : 120;
      gameAudio.startHeartbeat(bpm);
    }
    return () => gameAudio.stopHeartbeat();
  }, [isActive, isInSafeZone]);

  // Play alarm when entering danger zone
  useEffect(() => {
    if (!isInSafeZone && prevIsInSafeZone) {
      gameAudio.playAlarm();
    }
    setPrevIsInSafeZone(isInSafeZone);
  }, [isInSafeZone, prevIsInSafeZone]);

  const handleTap = () => {
    if (!isActive) return;
    setTapFeedback(true);
    gameAudio.playTap();
    onTap();
    setTimeout(() => setTapFeedback(false), 150);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple EKG visualization for player
  const getEkgPosition = () => {
    const { safeZoneMin, safeZoneMax } = SAFE_ACT_CONFIG.CRITICAL_SYNC;
    const safeZoneCenter = (safeZoneMin + safeZoneMax) / 2;
    const deviation = ekgValue - safeZoneCenter;
    return Math.max(0, Math.min(100, 50 + deviation));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 space-y-6">
      {/* Timer */}
      <div className={cn(
        "text-4xl font-bold font-display",
        timeRemaining <= 10 && "text-red-400 animate-pulse"
      )}>
        {formatTime(timeRemaining)}
      </div>

      {/* Status Indicator */}
      <div className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold",
        isInSafeZone 
          ? "bg-green-500/20 text-green-400" 
          : "bg-red-500/20 text-red-400 animate-pulse"
      )}>
        {isInSafeZone ? (
          <>
            <Heart className="w-6 h-6" />
            <span>STABLE</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6" />
            <span>CRITICAL!</span>
          </>
        )}
      </div>

      {/* Simple EKG Meter */}
      <div className="w-full max-w-md h-24 relative bg-muted rounded-xl overflow-hidden">
        {/* Safe Zone */}
        <div 
          className="absolute inset-y-0 bg-green-500/20 border-x-2 border-green-500"
          style={{
            left: `${SAFE_ACT_CONFIG.CRITICAL_SYNC.safeZoneMin}%`,
            width: `${SAFE_ACT_CONFIG.CRITICAL_SYNC.safeZoneMax - SAFE_ACT_CONFIG.CRITICAL_SYNC.safeZoneMin}%`,
          }}
        />
        
        {/* Current Value Indicator */}
        <div 
          className={cn(
            "absolute top-1/2 w-4 h-16 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-100",
            isInSafeZone ? "bg-green-400" : "bg-red-400"
          )}
          style={{ left: `${getEkgPosition()}%` }}
        />
      </div>

      {/* Tap Instructions */}
      <p className="text-center text-muted-foreground">
        แตะปุ่มพร้อมกันเพื่อรักษา EKG ให้อยู่ในโซนเขียว
      </p>

      {/* Giant Tap Button */}
      <button
        onClick={handleTap}
        disabled={!isActive}
        className={cn(
          "w-64 h-64 rounded-full flex flex-col items-center justify-center",
          "transition-all duration-100 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          tapFeedback ? "scale-95" : "scale-100",
          isInSafeZone 
            ? "bg-gradient-to-br from-green-500 to-green-700 shadow-[0_0_40px_rgba(34,197,94,0.5)]"
            : "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse"
        )}
      >
        <Heart className={cn(
          "w-24 h-24 text-white mb-2",
          tapFeedback && "animate-ping"
        )} />
        <span className="text-2xl font-bold text-white">TAP</span>
      </button>
    </div>
  );
}

// Main Display Component
interface CriticalSyncMainDisplayProps {
  ekgValue: number;
  timeRemaining: number;
  isInSafeZone: boolean;
  secondsOutsideZone: number;
  totalScore: number;
}

export function CriticalSyncMainDisplay({ 
  ekgValue, 
  timeRemaining, 
  isInSafeZone,
  secondsOutsideZone,
  totalScore
}: CriticalSyncMainDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ekgHistory, setEkgHistory] = useState<number[]>([]);

  // Add to EKG history
  useEffect(() => {
    setEkgHistory(prev => {
      const newHistory = [...prev, ekgValue];
      return newHistory.slice(-100);
    });
  }, [ekgValue]);

  // Draw EKG line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw safe zone
    const { safeZoneMin, safeZoneMax } = SAFE_ACT_CONFIG.CRITICAL_SYNC;
    const zoneTop = height * (1 - safeZoneMax / 100);
    const zoneBottom = height * (1 - safeZoneMin / 100);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.fillRect(0, zoneTop, width, zoneBottom - zoneTop);

    // Draw EKG line
    if (ekgHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = isInSafeZone ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowColor = isInSafeZone ? '#22c55e' : '#ef4444';
      ctx.shadowBlur = 10;

      ekgHistory.forEach((value, i) => {
        const x = (i / (ekgHistory.length - 1)) * width;
        const y = height * (1 - value / 100);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  }, [ekgHistory, isInSafeZone]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCodeBlue = secondsOutsideZone >= SAFE_ACT_CONFIG.CRITICAL_SYNC.codeBlueThreshold;

  return (
    <div className={cn(
      "relative w-full min-h-[60vh] flex flex-col items-center justify-center p-8 transition-all duration-500",
      isCodeBlue && "animate-pulse"
    )}>
      {/* Code Blue Overlay */}
      {isCodeBlue && (
        <div className="absolute inset-0 bg-red-500/30 animate-pulse flex items-center justify-center z-10">
          <div className="text-center">
            <AlertTriangle className="w-32 h-32 text-red-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-6xl font-bold text-red-400 font-display">CODE BLUE!</h2>
            <p className="text-2xl text-white mt-2">TAP NOW!</p>
          </div>
        </div>
      )}

      {/* Timer and Score */}
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
        
        <div className={cn(
          "flex items-center gap-3 px-8 py-4 rounded-full text-2xl font-bold",
          isInSafeZone 
            ? "bg-green-500/20 text-green-400" 
            : "bg-red-500/20 text-red-400"
        )}>
          <Heart className={cn("w-10 h-10", !isInSafeZone && "animate-ping")} />
          <span>{isInSafeZone ? "STABLE" : "CRITICAL"}</span>
        </div>

        <div className="text-center">
          <div className="text-5xl font-bold font-display text-primary">
            ฿{(totalScore / 1000000).toFixed(1)}M
          </div>
          <div className="text-muted-foreground">Score</div>
        </div>
      </div>

      {/* EKG Monitor */}
      <div className="glass-card p-6 w-full max-w-4xl">
        <canvas 
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-48 rounded-lg bg-background"
        />
        
        {/* Safe Zone Labels */}
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Danger Zone</span>
          <span className="text-green-400">Safe Zone</span>
          <span>Danger Zone</span>
        </div>
      </div>

      {/* Heartbeat Sound Visual */}
      <div className="flex items-center gap-4 mt-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 rounded-full transition-all duration-300",
              isInSafeZone ? "bg-green-400" : "bg-red-400"
            )}
            style={{
              height: `${20 + Math.sin(Date.now() / 200 + i) * 30}px`,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}

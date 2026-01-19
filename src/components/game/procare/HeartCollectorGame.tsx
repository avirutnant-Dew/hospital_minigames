import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Heart, Sparkles } from 'lucide-react';
import { FloatingHeart, PRO_CARE_CONFIG } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect, GoldenGlow } from '@/components/game/effects';

interface HeartCollectorGameProps {
  onCollect: () => void;
  heartsCollected: number;
  csiScore: number;
  timeRemaining: number;
  isActive: boolean;
}

export function HeartCollectorGame({
  onCollect,
  heartsCollected,
  csiScore,
  timeRemaining,
  isActive
}: HeartCollectorGameProps) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spawn hearts
  useEffect(() => {
    if (!isActive) return;

    const spawnHeart = () => {
      if (hearts.length >= PRO_CARE_CONFIG.HEART_COLLECTOR.maxHearts) return;

      const colors: FloatingHeart['color'][] = ['pink', 'red', 'rose'];
      const newHeart: FloatingHeart = {
        id: `heart-${Date.now()}-${Math.random()}`,
        x: Math.random() * 80 + 10,
        y: 110,
        size: 30 + Math.random() * 20,
        speed: 1 + Math.random() * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      setHearts(prev => [...prev, newHeart]);
    };

    const interval = setInterval(spawnHeart, PRO_CARE_CONFIG.HEART_COLLECTOR.spawnInterval);
    return () => clearInterval(interval);
  }, [isActive, hearts.length]);

  // Animate hearts floating up
  useEffect(() => {
    if (!isActive) return;

    const animationFrame = setInterval(() => {
      setHearts(prev =>
        prev
          .map(h => ({ ...h, y: h.y - h.speed }))
          .filter(h => h.y > -10)
      );
    }, 50);

    return () => clearInterval(animationFrame);
  }, [isActive]);

  const handleSwipe = (heartId: string) => {
    setHearts(prev => prev.filter(h => h.id !== heartId));
    gameAudio.playTap();
    setParticleTrigger(p => p + 1);
    onCollect();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHeartColor = (color: FloatingHeart['color']) => {
    switch (color) {
      case 'pink': return 'text-pink-400';
      case 'red': return 'text-red-500';
      case 'rose': return 'text-rose-400';
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          <span className="text-2xl font-bold text-pink-500">{heartsCollected}</span>
        </div>
        <div className={cn(
          "text-3xl font-bold font-display",
          timeRemaining <= 10 && "text-red-400 animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* CSI Bar */}
      <div className="w-full">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">CSI Score</span>
          <span className={cn(
            "font-bold",
            csiScore >= 90 ? "text-green-400" : csiScore >= 80 ? "text-yellow-400" : "text-pink-400"
          )}>{csiScore}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 transition-all duration-300"
            style={{ width: `${csiScore}%` }}
          />
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[60vh] bg-gradient-to-b from-pink-500/10 to-rose-500/20 rounded-2xl overflow-hidden"
      >
        {/* Collection Zone */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-dashed border-pink-400 rounded-xl flex items-center justify-center bg-pink-500/20">
          <Sparkles className="w-8 h-8 text-pink-400" />
        </div>

        {/* Floating Hearts */}
        {hearts.map(heart => (
          <button
            key={heart.id}
            onClick={() => handleSwipe(heart.id)}
            className={cn(
              "absolute transition-all active:scale-150 active:opacity-0 duration-300",
              "animate-in fade-in zoom-in duration-500",
              getHeartColor(heart.color)
            )}
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Heart
              className="fill-current animate-pulse hover:scale-110 transition-transform"
              style={{ width: heart.size, height: heart.size }}
            />
          </button>
        ))}

        {/* Particles */}
        <ParticleEffect trigger={particleTrigger > 0} type="success" />
      </div>

      {/* Instructions */}
      <p className="text-center text-pink-300 text-sm">
        แตะหัวใจเพื่อเก็บสะสม! ยิ่งเก็บมาก CSI ยิ่งสูง 💕
      </p>
    </div>
  );
}

// Main Display Component
interface HeartCollectorMainDisplayProps {
  heartsCollected: number;
  csiScore: number;
  timeRemaining: number;
}

export function HeartCollectorMainDisplay({
  heartsCollected,
  csiScore,
  timeRemaining
}: HeartCollectorMainDisplayProps) {
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; delay: number }[]>([]);

  // Generate flowing hearts effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingHearts(prev => {
        const newHearts = [...prev, {
          id: `${Date.now()}`,
          x: Math.random() * 100,
          delay: Math.random() * 0.5,
        }];
        return newHearts.slice(-30);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-950/50 to-rose-950/30 rounded-3xl overflow-hidden">
      {/* Floating Hearts Background */}
      {floatingHearts.map(heart => (
        <Heart
          key={heart.id}
          className="absolute text-pink-500/30 fill-pink-500/20 animate-float pointer-events-none"
          style={{
            left: `${heart.x}%`,
            bottom: '-10%',
            animationDelay: `${heart.delay}s`,
            animationDuration: '3s',
          }}
          size={20 + Math.random() * 30}
        />
      ))}

      {/* Timer */}
      <div className={cn(
        "text-6xl font-bold font-display mb-8",
        timeRemaining <= 10 && "text-red-400 animate-pulse"
      )}>
        {formatTime(timeRemaining)}
      </div>

      {/* Ambulance Collecting Hearts */}
      <div className="relative mb-8">
        <div className="text-[120px]">🚑</div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[...Array(Math.min(5, Math.floor(heartsCollected / 10)))].map((_, i) => (
            <Heart key={i} className="w-6 h-6 text-pink-500 fill-pink-500 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>

      {/* Hearts Counter */}
      <div className="flex items-center gap-4 mb-8">
        <Heart className="w-12 h-12 text-pink-500 fill-pink-500 animate-heartbeat" />
        <span className="text-6xl font-bold font-display text-pink-400">{heartsCollected}</span>
        <span className="text-2xl text-muted-foreground">Hearts</span>
      </div>

      {/* CSI Gauge */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-display font-bold">CSI Satisfaction</span>
          <span className={cn(
            "text-4xl font-bold font-display",
            csiScore >= 90 ? "text-green-400" : csiScore >= 80 ? "text-yellow-400" : "text-pink-400"
          )}>{csiScore}%</span>
        </div>
        <div className="h-8 bg-muted rounded-full overflow-hidden relative">
          <div
            className={cn(
              "h-full transition-all duration-500",
              csiScore >= 90
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-pink-400 via-rose-400 to-red-400"
            )}
            style={{ width: `${csiScore}%` }}
          />
          {/* 90% Target Line */}
          <div className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ left: '90%' }} />
        </div>
        <div className="flex justify-between mt-1 text-sm text-muted-foreground">
          <span>0%</span>
          <span className="text-yellow-400 font-bold">Target 90%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Golden Glow when above 90% */}
      <GoldenGlow active={csiScore >= 90} intensity="high" className="rounded-3xl" />
    </div>
  );
}

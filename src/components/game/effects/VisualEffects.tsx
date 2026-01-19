import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ParticleEffectProps {
  trigger: boolean;
  type: 'success' | 'error' | 'combo' | 'shield' | 'hazard' | 'victory';
  className?: string;
}

export function ParticleEffect({ trigger, type, className }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = [];
    const config = getParticleConfig(type);

    for (let i = 0; i < config.count; i++) {
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x: 50 + (Math.random() - 0.5) * config.spread,
        y: 50 + (Math.random() - 0.5) * config.spread,
        vx: (Math.random() - 0.5) * config.velocity,
        vy: (Math.random() - 0.5) * config.velocity - config.lift,
        size: config.minSize + Math.random() * (config.maxSize - config.minSize),
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        life: config.life,
        maxLife: config.life,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity
            life: p.life - 16,
          }))
          .filter(p => p.life > 0)
      );
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [trigger, type]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life / p.maxLife,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

function getParticleConfig(type: ParticleEffectProps['type']) {
  switch (type) {
    case 'success':
      return {
        count: 20,
        colors: ['#22c55e', '#86efac', '#4ade80', '#16a34a'],
        velocity: 3,
        lift: 2,
        spread: 20,
        minSize: 4,
        maxSize: 10,
        life: 800,
      };
    case 'error':
      return {
        count: 15,
        colors: ['#ef4444', '#f87171', '#dc2626'],
        velocity: 4,
        lift: 1,
        spread: 30,
        minSize: 3,
        maxSize: 8,
        life: 600,
      };
    case 'combo':
      return {
        count: 40,
        colors: ['#fbbf24', '#f59e0b', '#eab308', '#fcd34d', '#fef08a'],
        velocity: 5,
        lift: 3,
        spread: 40,
        minSize: 5,
        maxSize: 15,
        life: 1200,
      };
    case 'shield':
      return {
        count: 25,
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb'],
        velocity: 2,
        lift: 1,
        spread: 50,
        minSize: 3,
        maxSize: 8,
        life: 700,
      };
    case 'hazard':
      return {
        count: 12,
        colors: ['#f97316', '#fb923c', '#fdba74'],
        velocity: 3,
        lift: 2,
        spread: 15,
        minSize: 3,
        maxSize: 7,
        life: 500,
      };
    case 'victory':
      return {
        count: 60,
        colors: ['#fbbf24', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b'],
        velocity: 6,
        lift: 4,
        spread: 60,
        minSize: 6,
        maxSize: 18,
        life: 1500,
      };
    default:
      return {
        count: 10,
        colors: ['#ffffff'],
        velocity: 2,
        lift: 1,
        spread: 20,
        minSize: 4,
        maxSize: 8,
        life: 600,
      };
  }
}

// Golden Glow Effect Component
interface GoldenGlowProps {
  active: boolean;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function GoldenGlow({ active, intensity = 'medium', className }: GoldenGlowProps) {
  if (!active) return null;

  const glowSize = {
    low: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    medium: 'shadow-[0_0_60px_rgba(251,191,36,0.5)]',
    high: 'shadow-[0_0_100px_rgba(251,191,36,0.7)]',
  };

  return (
    <div 
      className={cn(
        "absolute inset-0 rounded-inherit pointer-events-none",
        "bg-gradient-to-r from-yellow-400/10 via-amber-300/20 to-yellow-400/10",
        "animate-pulse",
        glowSize[intensity],
        className
      )}
    />
  );
}

// Screen Flash Effect
interface ScreenFlashProps {
  trigger: boolean;
  color: 'green' | 'red' | 'gold' | 'blue';
}

export function ScreenFlash({ trigger, color }: ScreenFlashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  if (!visible) return null;

  const colors = {
    green: 'bg-green-500/30',
    red: 'bg-red-500/30',
    gold: 'bg-yellow-400/30',
    blue: 'bg-blue-500/30',
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none z-50 animate-fade-out",
        colors[color]
      )}
    />
  );
}

// Pulse Ring Effect
interface PulseRingProps {
  active: boolean;
  color: string;
  className?: string;
}

export function PulseRing({ active, color, className }: PulseRingProps) {
  if (!active) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border-2 animate-ping"
          style={{
            borderColor: color,
            animationDelay: `${i * 300}ms`,
            animationDuration: '1.5s',
          }}
        />
      ))}
    </div>
  );
}

// Shake Effect Hook
export function useShakeEffect() {
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const shakeClass = isShaking ? 'animate-[shake_0.5s_ease-in-out]' : '';

  return { shakeClass, triggerShake, isShaking };
}

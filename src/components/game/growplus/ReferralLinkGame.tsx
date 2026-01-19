import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GAME_CONFIG } from './types';

interface Node {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface ReferralLinkGameProps {
  onLink: () => void;
  totalScore: number;
  timeRemaining: number;
  isActive: boolean;
}

export function ReferralLinkGame({ onLink, totalScore, timeRemaining, isActive }: ReferralLinkGameProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [linkCount, setLinkCount] = useState(0);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeIdRef = useRef(0);

  // Spawn nodes continuously
  useEffect(() => {
    if (!isActive) return;

    const spawnNode = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const minRadius = 80;
      const maxRadius = Math.min(rect.width, rect.height) / 2 - 20;
      
      // Random position around the center
      const angle = Math.random() * 2 * Math.PI;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      
      const newNode: Node = {
        id: nodeIdRef.current++,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        collected: false,
      };

      setNodes((prev) => [...prev.slice(-20), newNode]); // Keep max 20 nodes
    };

    const interval = setInterval(spawnNode, 400);
    spawnNode(); // Initial spawn

    return () => clearInterval(interval);
  }, [isActive]);

  const handleNodeClick = useCallback((nodeId: number) => {
    if (!isActive) return;
    
    setNodes((prev) => prev.map((n) => 
      n.id === nodeId ? { ...n, collected: true } : n
    ));
    setLinkCount((prev) => prev + 1);
    onLink();

    // Remove collected node after animation
    setTimeout(() => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    }, 300);
  }, [isActive, onLink]);

  const formatRevenue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    return value.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Timer & Score */}
      <div className="flex justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-4xl font-display font-bold text-gradient">{timeRemaining}s</div>
          <p className="text-xs text-muted-foreground">เหลือเวลา</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-display font-bold text-accent">{linkCount}</div>
          <p className="text-xs text-muted-foreground">Links</p>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square max-w-sm bg-muted/20 rounded-2xl border-2 border-primary/30 overflow-hidden"
      >
        {/* Center Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)]">
            <span className="text-2xl font-display font-bold text-white">PRINC</span>
          </div>
        </div>

        {/* Network Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.filter(n => !n.collected).map((node) => {
            const container = containerRef.current;
            if (!container) return null;
            const rect = container.getBoundingClientRect();
            return (
              <line
                key={`line-${node.id}`}
                x1={rect.width / 2}
                y1={rect.height / 2}
                x2={node.x}
                y2={node.y}
                stroke="rgba(251, 191, 36, 0.3)"
                strokeWidth="2"
                strokeDasharray="4,4"
                className="animate-pulse"
              />
            );
          })}
        </svg>

        {/* Floating Nodes */}
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            disabled={node.collected}
            className={cn(
              "absolute w-10 h-10 -ml-5 -mt-5 rounded-full",
              "bg-gradient-to-br from-yellow-400 to-amber-500",
              "shadow-[0_0_20px_rgba(251,191,36,0.5)]",
              "hover:scale-125 active:scale-90 transition-all duration-150",
              "flex items-center justify-center text-amber-900 font-bold",
              node.collected && "animate-ping opacity-0 scale-150"
            )}
            style={{ left: node.x, top: node.y }}
          >
            🔗
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        แตะ Nodes เพื่อเชื่อมต่อเครือข่าย! (+{formatRevenue(GAME_CONFIG.REFERRAL_LINK.scorePerAction)}/link)
      </p>
    </div>
  );
}

// Main Stage Display
export function ReferralLinkMainDisplay({ 
  totalScore, 
  timeRemaining,
  recentLinks 
}: { 
  totalScore: number; 
  timeRemaining: number;
  recentLinks: Array<{ player: string; timestamp: number }>;
}) {
  const linkCount = Math.floor(totalScore / GAME_CONFIG.REFERRAL_LINK.scorePerAction);

  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    return value.toLocaleString();
  };

  return (
    <div className="glass-card p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-gradient">
          🔗 Referral Link Challenge
        </h2>
        <p className="text-muted-foreground">Volume Battle - สร้างเครือข่ายให้มากที่สุด!</p>
      </div>

      <div className="flex justify-center">
        <div className={cn(
          "text-7xl font-display font-bold",
          timeRemaining <= 10 ? "text-destructive animate-pulse" : "text-gradient"
        )}>
          {timeRemaining}s
        </div>
      </div>

      {/* Network Visualization */}
      <div className="relative h-64 bg-muted/20 rounded-xl overflow-hidden flex items-center justify-center">
        {/* Center Logo */}
        <div className="relative z-10">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.6)]">
            <div className="text-center">
              <span className="text-xl font-display font-bold text-white block">PRINC</span>
              <span className="text-xs text-white/80">Paknampo</span>
            </div>
          </div>
        </div>

        {/* Animated connection lines */}
        {Array.from({ length: Math.min(linkCount, 20) }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-20 bg-gradient-to-t from-amber-400 to-transparent opacity-60"
            style={{
              left: '50%',
              top: '50%',
              transformOrigin: 'center bottom',
              transform: `rotate(${(360 / 20) * i}deg) translateY(-60px)`,
              animation: `pulse 1s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 rounded-xl bg-accent/10">
          <div className="text-4xl font-display font-bold text-accent">{linkCount}</div>
          <p className="text-sm text-muted-foreground">Total Links</p>
        </div>
        <div className="p-4 rounded-xl bg-strategy-grow/10">
          <div className="text-4xl font-display font-bold text-strategy-grow">{formatRevenue(totalScore)}</div>
          <p className="text-sm text-muted-foreground">Revenue</p>
        </div>
      </div>
    </div>
  );
}

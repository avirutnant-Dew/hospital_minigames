import { cn } from "@/lib/utils";
import { Star, Shield, Heart, Gift, Zap, Flag, Play } from "lucide-react";

interface GameTileProps {
  tile: {
    id: number;
    type: string;
    label: string;
  };
  index: number;
}

export function GameTile({ tile, index }: GameTileProps) {
  const getTypeStyles = () => {
    switch (tile.type) {
      case "start":
        return "bg-primary/30 border-primary text-primary";
      case "grow":
        return "bg-strategy-grow/20 border-strategy-grow text-strategy-grow";
      case "safe":
        return "bg-strategy-safe/20 border-strategy-safe text-strategy-safe";
      case "care":
        return "bg-strategy-care/20 border-strategy-care text-strategy-care";
      case "bonus":
        return "bg-accent/20 border-accent text-accent";
      case "challenge":
        return "bg-destructive/20 border-destructive text-destructive";
      case "finish":
        return "bg-gradient-to-br from-primary/40 to-accent/40 border-accent text-accent glow-border";
      default:
        return "bg-muted/30 border-muted-foreground";
    }
  };

  const getIcon = () => {
    switch (tile.type) {
      case "start":
        return <Play className="w-5 h-5" />;
      case "grow":
        return <Star className="w-5 h-5" />;
      case "safe":
        return <Shield className="w-5 h-5" />;
      case "care":
        return <Heart className="w-5 h-5" />;
      case "bonus":
        return <Gift className="w-5 h-5" />;
      case "challenge":
        return <Zap className="w-5 h-5" />;
      case "finish":
        return <Flag className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 min-h-[90px]",
        getTypeStyles(),
        tile.type === "finish" && "animate-glow-pulse"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        transform: "rotateX(10deg)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Tile Number */}
      <span className="absolute top-1 left-2 text-xs font-display opacity-50">
        {tile.id}
      </span>

      {/* Icon */}
      <div className="mb-1">{getIcon()}</div>

      {/* Label */}
      <span className="text-xs font-semibold text-center leading-tight font-display">
        {tile.label}
      </span>

      {/* Shimmer Effect for Special Tiles */}
      {(tile.type === "bonus" || tile.type === "finish") && (
        <div className="absolute inset-0 rounded-xl shimmer pointer-events-none" />
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Ambulance } from "lucide-react";

interface AmbulanceTokenProps {
  team: {
    id: string;
    name: string;
    color: string;
  };
  colorClass: string;
  position: number;
  totalTiles: number;
}

export function AmbulanceToken({ team, colorClass, position, totalTiles }: AmbulanceTokenProps) {
  // Calculate grid position (6 columns)
  const col = position % 6;
  const row = Math.floor(position / 6);
  
  // Add offset for multiple tokens on same tile
  const offset = parseInt(team.id.slice(-2), 16) % 5;

  return (
    <div
      className={cn(
        "absolute ambulance-token z-10 transition-all duration-1000 ease-out",
        `text-${colorClass}`
      )}
      style={{
        left: `calc(${col * (100/6)}% + ${12 + offset * 6}px)`,
        top: `calc(${row * 25}% + ${12 + offset * 6}px)`,
        color: team.color,
      }}
    >
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 blur-md opacity-60"
        style={{ backgroundColor: team.color }}
      />
      
      {/* Ambulance Icon */}
      <div className="relative">
        <Ambulance 
          className="w-8 h-8 drop-shadow-lg animate-bounce-soft" 
          style={{ 
            filter: `drop-shadow(0 0 8px ${team.color})`,
            animationDelay: `${offset * 200}ms`
          }}
        />
        
        {/* Team Name Badge */}
        <span 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border"
          style={{ borderColor: team.color, color: team.color }}
        >
          {team.name.replace("Team ", "")}
        </span>
      </div>
    </div>
  );
}

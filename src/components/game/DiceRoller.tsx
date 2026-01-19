import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dice6 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiceRollerProps {
  onRoll: (value: number) => void;
  disabled?: boolean;
  isRolling?: boolean;
}

export function DiceRoller({ onRoll, disabled, isRolling: externalRolling }: DiceRollerProps) {
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (disabled || isRolling) return;
    
    setIsRolling(true);
    
    // Animate dice values
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount >= 15) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        onRoll(finalValue);
      }
    }, 80);
  };

  const getDiceFace = (value: number | null) => {
    if (!value) return "?";
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return faces[value - 1];
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dice Display */}
      <div 
        className={cn(
          "w-32 h-32 flex items-center justify-center rounded-2xl border-4 border-primary/50 bg-card/80 backdrop-blur-xl",
          isRolling && "animate-dice-roll",
          !isRolling && diceValue && "animate-glow-pulse"
        )}
        style={{
          boxShadow: diceValue ? `0 0 40px hsl(var(--primary) / 0.5)` : undefined,
        }}
      >
        <span className="text-7xl font-display">
          {getDiceFace(diceValue)}
        </span>
      </div>

      {/* Value Display */}
      {diceValue && !isRolling && (
        <div className="text-4xl font-display font-bold text-gradient animate-fade-in-up">
          เดิน {diceValue} ช่อง!
        </div>
      )}

      {/* Roll Button */}
      <Button
        size="lg"
        onClick={handleRoll}
        disabled={disabled || isRolling || externalRolling}
        className={cn(
          "dice-button h-16 px-10 text-xl font-display font-bold rounded-xl",
          "bg-gradient-to-r from-primary to-secondary text-primary-foreground",
          "hover:shadow-lg transition-all duration-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Dice6 className="w-6 h-6 mr-2" />
        {isRolling ? "กำลังทอย..." : "ทอยลูกเต๋า"}
      </Button>

      {disabled && (
        <p className="text-muted-foreground text-sm animate-pulse">
          รอ Admin ปลดล็อคลูกเต๋า...
        </p>
      )}
    </div>
  );
}

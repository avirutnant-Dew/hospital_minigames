import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GrowPlusGameType } from "./types";
import { Trophy, Coins, Link2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalRevenue: number;
  gameType: GrowPlusGameType;
}

const GAME_ICONS: Record<GrowPlusGameType, React.ReactNode> = {
  REVENUE_TAP: <Coins className="w-12 h-12 text-amber-500" />,
  REFERRAL_LINK: <Link2 className="w-12 h-12 text-primary" />,
  SBU_COMBO: <Zap className="w-12 h-12 text-accent" />,
};

const GAME_TITLES: Record<GrowPlusGameType, string> = {
  REVENUE_TAP: "Revenue Tap",
  REFERRAL_LINK: "Referral Link",
  SBU_COMBO: "SBU Combo Rush",
};

export function GameSummaryModal({ open, onOpenChange, totalRevenue, gameType }: GameSummaryModalProps) {
  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toLocaleString();
  };
  const formatRevenueMB = (value: number) => {
    return (value / 1_000_000).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display">🏆 Game Complete!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trophy Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <Trophy className="w-24 h-24 text-strategy-grow animate-bounce" />
              <div className="absolute inset-0 animate-ping">
                <Trophy className="w-24 h-24 text-strategy-grow opacity-30" />
              </div>
            </div>
          </div>

          {/* Game Type */}
          <div className="flex items-center justify-center gap-3">
            {GAME_ICONS[gameType]}
            <span className="text-xl font-display font-bold">{GAME_TITLES[gameType]}</span>
          </div>

          {/* Team Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Team Summary</h3>

            <div
              className={cn(
                "p-6 rounded-xl text-center",
                "bg-gradient-to-br from-strategy-grow/20 to-yellow-500/20",
                "border-2 border-strategy-grow/50",
              )}
            >
              <p className="text-sm text-muted-foreground mb-2">Total Revenue Earned</p>
              <div className="text-5xl font-display font-bold text-gradient">{formatRevenue(totalRevenue)}</div>
              <p className="text-sm text-strategy-grow mt-2"> MB (ล้านบาท)</p>
            </div>
          </div>

          {/* Close Button */}
          <Button
            size="lg"
            onClick={() => onOpenChange(false)}
            className="w-full font-display font-bold bg-gradient-to-r from-strategy-grow to-yellow-400"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

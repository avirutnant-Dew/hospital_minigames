import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gift, Sparkles, Coins, PartyPopper } from "lucide-react";

interface BonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  teamName?: string;
}

export function BonusModal({
  open,
  onOpenChange,
  amount,
  teamName,
}: BonusModalProps) {
  const [isRevealing, setIsRevealing] = useState(true);

  // Auto-reveal after animation
  useEffect(() => {
    if (open) {
      setIsRevealing(true);
      const timer = setTimeout(() => {
        setIsRevealing(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const amountInMB = amount / 1000000;

  const handleClose = () => {
    setIsRevealing(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent">
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "bg-gradient-to-br from-amber-500/20 via-background to-yellow-500/20",
            "border-2 border-amber-400"
          )}
        >
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40 bg-amber-400 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-40 bg-yellow-400 animate-pulse" />
            
            {/* Floating sparkles */}
            {[...Array(8)].map((_, i) => (
              <Sparkles
                key={i}
                className={cn(
                  "absolute text-amber-400/60 w-4 h-4",
                  "animate-bounce"
                )}
                style={{
                  top: `${10 + (i * 12)}%`,
                  left: `${5 + (i * 12)}%`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: `${1.5 + (i * 0.1)}s`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative p-8">
            {/* Loading State */}
            {isRevealing && (
              <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="relative">
                  <Gift className="w-24 h-24 text-amber-400 animate-bounce" />
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-spin" />
                </div>
                <p className="mt-6 text-xl font-display font-bold text-amber-400">
                  กำลังเปิดกล่องโบนัส...
                </p>
              </div>
            )}

            {/* Bonus Revealed */}
            {!isRevealing && (
              <div className="animate-scale-in space-y-6 text-center">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex justify-center gap-2 text-amber-400">
                    <PartyPopper className="w-8 h-8 animate-bounce" />
                    <span className="text-2xl font-display font-bold">BONUS!</span>
                    <PartyPopper className="w-8 h-8 animate-bounce" style={{ animationDelay: "0.1s" }} />
                  </div>
                  {teamName && (
                    <p className="text-muted-foreground">{teamName}</p>
                  )}
                </div>

                {/* Amount Display */}
                <div className="py-6">
                  <div className="relative inline-block">
                    <Coins className="absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 text-amber-400 animate-bounce" />
                    <div className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400">
                      {amountInMB} MB
                    </div>
                    <Coins className="absolute -right-12 top-1/2 -translate-y-1/2 w-10 h-10 text-amber-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    ({amount.toLocaleString()} บาท)
                  </p>
                </div>

                {/* Celebration Text */}
                <p className="text-lg font-semibold text-amber-400/80">
                  🎉 ยินดีด้วย! เพิ่มเข้ารายได้ทีมแล้ว! 🎉
                </p>

                {/* Close Button */}
                <Button
                  size="lg"
                  onClick={handleClose}
                  className={cn(
                    "w-full h-14 text-lg font-display font-bold",
                    "bg-gradient-to-r from-amber-500 to-yellow-500",
                    "hover:from-amber-600 hover:to-yellow-600",
                    "text-white shadow-lg shadow-amber-500/30"
                  )}
                >
                  <Gift className="w-5 h-5 mr-2" />
                  รับรางวัล
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

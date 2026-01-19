import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle, XCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { SafeActGameType } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect } from '@/components/game/effects';

interface SafeActSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shieldHealth: number;
  totalCorrect: number;
  totalWrong: number;
  hazardsCleared: number;
  gameType: SafeActGameType;
}

export function SafeActSummaryModal({
  open,
  onOpenChange,
  shieldHealth,
  totalCorrect,
  totalWrong,
  hazardsCleared,
  gameType,
}: SafeActSummaryModalProps) {
  const isSuccess = shieldHealth >= 50;
  const accuracy = totalCorrect + totalWrong > 0 
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
    : 0;

  // Play victory or game over sound
  useEffect(() => {
    if (open) {
      if (isSuccess) {
        gameAudio.playVictory();
      } else {
        gameAudio.playGameOver();
      }
    }
  }, [open, isSuccess]);

  const getGameTitle = () => {
    switch (gameType) {
      case 'RISK_DEFENDER': return 'Risk Defender';
      case 'CRITICAL_SYNC': return 'Critical Sync';
      case 'HAZARD_POPPER': return 'Hazard Popper';
      default: return 'SAFE ACT';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-lg border-0",
        isSuccess 
          ? "bg-gradient-to-br from-green-950 to-background" 
          : "bg-gradient-to-br from-red-950 to-background"
      )}>
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center gap-4">
              {isSuccess ? (
                <>
                  <div className="relative">
                    <Sparkles className="w-24 h-24 text-yellow-400 animate-pulse" />
                    <Shield className="w-16 h-16 text-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-green-400">
                    Mission Complete!
                  </h2>
                </>
              ) : (
                <>
                  <div className="relative">
                    <AlertTriangle className="w-24 h-24 text-red-400 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-red-400">
                    Shield Damaged!
                  </h2>
                </>
              )}
              <p className="text-xl text-muted-foreground">{getGameTitle()}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shield Health */}
          <div className="text-center">
            <div className="text-6xl font-bold font-display mb-2" 
              style={{ color: shieldHealth > 70 ? '#22c55e' : shieldHealth > 40 ? '#eab308' : '#ef4444' }}>
              {shieldHealth}%
            </div>
            <p className="text-muted-foreground">Final Shield Health</p>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden mt-2">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  shieldHealth > 70 ? "bg-green-500" : 
                  shieldHealth > 40 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${shieldHealth}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-400">{totalCorrect}</div>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="glass-card p-4 text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-400">{totalWrong}</div>
              <p className="text-sm text-muted-foreground">Wrong</p>
            </div>
          </div>

          {/* Accuracy */}
          <div className="glass-card p-4 text-center">
            <div className="text-4xl font-bold font-display text-primary">{accuracy}%</div>
            <p className="text-muted-foreground">Team Accuracy</p>
          </div>

          {/* Hazards (for Hazard Popper) */}
          {gameType === 'HAZARD_POPPER' && (
            <div className="glass-card p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-yellow-400">{hazardsCleared}</div>
              <p className="text-sm text-muted-foreground">Hazards Cleared</p>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full h-12 text-lg font-display"
        >
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}

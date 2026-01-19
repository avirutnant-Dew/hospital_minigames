import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, Smile, MessageCircle, Star, Sparkles, Trophy } from 'lucide-react';
import { ProCareGameType } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect } from '@/components/game/effects';

interface ProCareSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csiScore: number;
  heartsCollected: number;
  customersHelped: number;
  correctVotes: number;
  totalVotes: number;
  gameType: ProCareGameType;
}

export function ProCareSummaryModal({
  open,
  onOpenChange,
  csiScore,
  heartsCollected,
  customersHelped,
  correctVotes,
  totalVotes,
  gameType,
}: ProCareSummaryModalProps) {
  const isSuccess = csiScore >= 90;
  const voteAccuracy = totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0;

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
      case 'HEART_COLLECTOR': return 'Heart Collector';
      case 'EMPATHY_ECHO': return 'Empathy Echo';
      case 'SMILE_SPARKLE': return 'Smile Sparkle';
      default: return 'PRO CARE';
    }
  };

  const getGameIcon = () => {
    switch (gameType) {
      case 'HEART_COLLECTOR': return <Heart className="w-16 h-16 text-pink-500 fill-pink-500" />;
      case 'EMPATHY_ECHO': return <MessageCircle className="w-16 h-16 text-purple-400" />;
      case 'SMILE_SPARKLE': return <Smile className="w-16 h-16 text-yellow-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-lg border-0",
        isSuccess 
          ? "bg-gradient-to-br from-pink-950 via-rose-950 to-background" 
          : "bg-gradient-to-br from-slate-950 to-background"
      )}>
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center gap-4">
              {isSuccess ? (
                <>
                  <div className="relative">
                    <Sparkles className="w-24 h-24 text-yellow-400 animate-pulse" />
                    <Trophy className="w-12 h-12 text-yellow-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-pink-400">
                    CSI Target Achieved! 🎉
                  </h2>
                </>
              ) : (
                <>
                  <div className="relative">
                    {getGameIcon()}
                  </div>
                  <h2 className="text-3xl font-display font-bold text-muted-foreground">
                    Keep Improving!
                  </h2>
                </>
              )}
              <p className="text-xl text-muted-foreground">{getGameTitle()}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* CSI Score */}
          <div className="text-center">
            <div className={cn(
              "text-7xl font-bold font-display mb-2",
              csiScore >= 90 ? "text-green-400" : csiScore >= 80 ? "text-yellow-400" : "text-pink-400"
            )}>
              {csiScore}%
            </div>
            <p className="text-muted-foreground">NPS/CSI Final Score</p>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden mt-2">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  csiScore >= 90 
                    ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                    : "bg-gradient-to-r from-pink-400 to-rose-500"
                )}
                style={{ width: `${csiScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-yellow-400">Target 90%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {gameType === 'HEART_COLLECTOR' && (
              <div className="glass-card p-4 text-center col-span-2 bg-pink-500/10">
                <Heart className="w-8 h-8 text-pink-500 fill-pink-500 mx-auto mb-2" />
                <div className="text-4xl font-bold text-pink-400">{heartsCollected}</div>
                <p className="text-sm text-muted-foreground">Hearts Collected</p>
              </div>
            )}
            
            {gameType === 'EMPATHY_ECHO' && (
              <>
                <div className="glass-card p-4 text-center bg-green-500/10">
                  <Star className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-400">{correctVotes}</div>
                  <p className="text-sm text-muted-foreground">Correct Votes</p>
                </div>
                <div className="glass-card p-4 text-center bg-purple-500/10">
                  <MessageCircle className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-purple-400">{voteAccuracy}%</div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </>
            )}
            
            {gameType === 'SMILE_SPARKLE' && (
              <>
                <div className="glass-card p-4 text-center bg-yellow-500/10">
                  <Smile className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-yellow-400">{customersHelped}</div>
                  <p className="text-sm text-muted-foreground">Customers Smiled</p>
                </div>
                <div className="glass-card p-4 text-center bg-orange-500/10">
                  <Sparkles className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-orange-400">{heartsCollected + customersHelped}</div>
                  <p className="text-sm text-muted-foreground">Total Impact</p>
                </div>
              </>
            )}
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="glass-card p-4 text-center bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/30">
              <p className="text-lg text-pink-300">
                🎊 ยอดเยี่ยม! ทีมส่งมอบบริการที่เหนือความคาดหวังของลูกค้า!
              </p>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full h-12 text-lg font-display bg-gradient-to-r from-pink-500 to-rose-500"
        >
          Continue
        </Button>

        {isSuccess && <ParticleEffect trigger={true} type="victory" />}
      </DialogContent>
    </Dialog>
  );
}

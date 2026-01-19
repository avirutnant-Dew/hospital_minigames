import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Smile, Frown, Meh, Sparkles, PartyPopper } from 'lucide-react';
import { CustomerFace, CUSTOMER_EMOTIONS, PRO_CARE_CONFIG } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect, GoldenGlow, PulseRing } from '@/components/game/effects';

interface SmileSparkleGameProps {
  onTap: () => void;
  smileTaps: number;
  customersHelped: number;
  csiScore: number;
  timeRemaining: number;
  isActive: boolean;
}

export function SmileSparkleGame({ 
  onTap, 
  smileTaps, 
  customersHelped, 
  csiScore, 
  timeRemaining, 
  isActive 
}: SmileSparkleGameProps) {
  const [tapFeedback, setTapFeedback] = useState(false);
  const [localTaps, setLocalTaps] = useState(0);

  const handleTap = () => {
    if (!isActive) return;
    setTapFeedback(true);
    setLocalTaps(l => l + 1);
    gameAudio.playTap();
    onTap();
    setTimeout(() => setTapFeedback(false), 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressToNextSmile = (smileTaps % PRO_CARE_CONFIG.SMILE_SPARKLE.tapsPerSmile) / PRO_CARE_CONFIG.SMILE_SPARKLE.tapsPerSmile * 100;

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Smile className="w-6 h-6 text-yellow-400" />
          <span className="text-xl font-bold text-yellow-400">{customersHelped} Smiles</span>
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
            csiScore >= 90 ? "text-green-400" : "text-pink-400"
          )}>{csiScore}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-400 to-yellow-400 transition-all duration-300"
            style={{ width: `${csiScore}%` }}
          />
        </div>
      </div>

      {/* Progress to next smile */}
      <div className="w-full">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress to Next Smile</span>
          <span className="text-yellow-400 font-bold">{Math.round(progressToNextSmile)}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-100"
            style={{ width: `${progressToNextSmile}%` }}
          />
        </div>
      </div>

      {/* Big Smile Boost Button */}
      <div className="flex-1 flex items-center justify-center w-full">
        <button
          onClick={handleTap}
          disabled={!isActive}
          className={cn(
            "w-64 h-64 rounded-full flex flex-col items-center justify-center",
            "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500",
            "shadow-[0_0_60px_rgba(251,191,36,0.5)]",
            "transition-all duration-100 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed relative",
            tapFeedback && "scale-95"
          )}
        >
          <PulseRing active={isActive} color="#fbbf24" />
          <Smile className={cn(
            "w-24 h-24 text-white mb-2",
            tapFeedback && "scale-110"
          )} />
          <span className="text-2xl font-bold text-white font-display">SMILE</span>
          <span className="text-lg text-white/80">BOOST</span>
        </button>
      </div>

      {/* Your Contribution */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Your taps: {localTaps}</p>
        <p className="text-pink-400 text-sm">Team total: {smileTaps}</p>
      </div>
    </div>
  );
}

// Main Display Component
interface SmileSparkleMainDisplayProps {
  smileTaps: number;
  customersHelped: number;
  currentCustomer: CustomerFace | null;
  csiScore: number;
  timeRemaining: number;
}

export function SmileSparkleMainDisplay({ 
  smileTaps, 
  customersHelped, 
  currentCustomer,
  csiScore, 
  timeRemaining 
}: SmileSparkleMainDisplayProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCustomersHelped, setPrevCustomersHelped] = useState(customersHelped);

  // Celebrate when customer is helped
  useEffect(() => {
    if (customersHelped > prevCustomersHelped) {
      setShowCelebration(true);
      gameAudio.playVictory();
      setTimeout(() => setShowCelebration(false), 2000);
    }
    setPrevCustomersHelped(customersHelped);
  }, [customersHelped, prevCustomersHelped]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionEmoji = (emotion: string, isSmiling: boolean) => {
    if (isSmiling) return '😊';
    switch (emotion) {
      case 'worried': return '😟';
      case 'waiting': return '😐';
      case 'frustrated': return '😤';
      default: return '😐';
    }
  };

  const progressToNextSmile = currentCustomer 
    ? (currentCustomer.currentTaps / currentCustomer.targetTaps) * 100 
    : (smileTaps % PRO_CARE_CONFIG.SMILE_SPARKLE.tapsPerSmile) / PRO_CARE_CONFIG.SMILE_SPARKLE.tapsPerSmile * 100;

  return (
    <div className="relative w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-yellow-950/30 to-orange-950/20 rounded-3xl overflow-hidden">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-yellow-500/20">
          <div className="text-center">
            <PartyPopper className="w-32 h-32 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-5xl font-bold text-yellow-400 font-display">CUSTOMER HAPPY!</h2>
          </div>
          <ParticleEffect trigger={true} type="victory" />
        </div>
      )}

      {/* Timer and Score */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-8">
        <div className={cn(
          "text-5xl font-bold font-display",
          timeRemaining <= 10 && "text-red-400 animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </div>
        
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Customers Helped</div>
          <div className="text-5xl font-bold font-display text-yellow-400">
            {customersHelped}
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg text-muted-foreground">CSI Score</div>
          <div className={cn(
            "text-4xl font-bold font-display",
            csiScore >= 90 ? "text-green-400" : "text-pink-400"
          )}>
            {csiScore}%
          </div>
        </div>
      </div>

      {/* Customer Face */}
      <div className="relative mb-8">
        <div className={cn(
          "text-[150px] transition-transform duration-500",
          currentCustomer?.isSmiling && "scale-110"
        )}>
          {currentCustomer 
            ? getEmotionEmoji(currentCustomer.emotion, currentCustomer.isSmiling)
            : getEmotionEmoji('waiting', progressToNextSmile >= 100)
          }
        </div>
        
        {/* Sparkles around smiling customer */}
        {(currentCustomer?.isSmiling || progressToNextSmile >= 100) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <Sparkles 
                key={i} 
                className="absolute w-8 h-8 text-yellow-400 animate-pulse"
                style={{
                  top: `${50 + Math.sin(i * Math.PI / 4) * 60}%`,
                  left: `${50 + Math.cos(i * Math.PI / 4) * 60}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-2">
          <span className="text-xl font-display">Happiness Progress</span>
          <span className="text-2xl font-bold text-yellow-400">{smileTaps} taps</span>
        </div>
        <div className="h-8 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 transition-all duration-100"
            style={{ width: `${Math.min(100, progressToNextSmile)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-sm text-muted-foreground">
          <span>😐 Neutral</span>
          <span>😊 Happy!</span>
        </div>
      </div>

      {/* Golden Glow when customer is smiling */}
      <GoldenGlow active={currentCustomer?.isSmiling || progressToNextSmile >= 100} intensity="high" className="rounded-3xl" />
    </div>
  );
}

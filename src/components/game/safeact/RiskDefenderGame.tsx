import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { BEHAVIOR_CARDS, BehaviorCard, SAFE_ACT_CONFIG } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ParticleEffect, ScreenFlash } from '@/components/game/effects';

interface RiskDefenderGameProps {
  onSwipe: (isCorrect: boolean, cardId: string) => void;
  shieldHealth: number;
  timeRemaining: number;
  isActive: boolean;
}

export function RiskDefenderGame({ onSwipe, shieldHealth, timeRemaining, isActive }: RiskDefenderGameProps) {
  const [currentCard, setCurrentCard] = useState<BehaviorCard | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [prevTimeRemaining, setPrevTimeRemaining] = useState(timeRemaining);

  const getNextCard = useCallback(() => {
    const availableCards = BEHAVIOR_CARDS.filter(c => !usedCards.has(c.id));
    if (availableCards.length === 0) {
      setUsedCards(new Set());
      return BEHAVIOR_CARDS[Math.floor(Math.random() * BEHAVIOR_CARDS.length)];
    }
    return availableCards[Math.floor(Math.random() * availableCards.length)];
  }, [usedCards]);

  useEffect(() => {
    if (isActive && !currentCard) {
      setCurrentCard(getNextCard());
    }
  }, [isActive, currentCard, getNextCard]);

  // Countdown audio
  useEffect(() => {
    if (timeRemaining !== prevTimeRemaining && timeRemaining <= 10 && timeRemaining > 0) {
      gameAudio.playUrgentTick();
    } else if (timeRemaining !== prevTimeRemaining && timeRemaining > 10) {
      gameAudio.playTick();
    }
    setPrevTimeRemaining(timeRemaining);
  }, [timeRemaining, prevTimeRemaining]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentCard || !isActive) return;

    setSwipeDirection(direction);

    // Left = Risk, Right = Safe
    const isCorrect = (direction === 'left' && currentCard.isRisk) ||
      (direction === 'right' && !currentCard.isRisk);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setParticleTrigger(p => p + 1);
    setFlashTrigger(f => f + 1);

    if (isCorrect) {
      gameAudio.playSuccess();
    } else {
      gameAudio.playShieldDamage();
    }

    onSwipe(isCorrect, currentCard.id);
    setUsedCards(prev => new Set(prev).add(currentCard.id));

    setTimeout(() => {
      setSwipeDirection(null);
      setFeedback(null);
      setCurrentCard(getNextCard());
    }, 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 space-y-6">
      {/* Timer and Shield */}
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center gap-2">
          <Shield className={cn(
            "w-8 h-8",
            shieldHealth > 70 ? "text-green-400" :
              shieldHealth > 40 ? "text-yellow-400" : "text-red-400"
          )} />
          <div className="text-2xl font-bold font-display">{shieldHealth}%</div>
        </div>
        <div className={cn(
          "text-3xl font-bold font-display",
          timeRemaining <= 10 && "text-red-400 animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Shield Health Bar */}
      <div className="w-full max-w-md h-4 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            shieldHealth > 70 ? "bg-green-500" :
              shieldHealth > 40 ? "bg-yellow-500" : "bg-red-500"
          )}
          style={{ width: `${shieldHealth}%` }}
        />
      </div>

      {/* Swipe Instructions */}
      <div className="flex items-center justify-between w-full max-w-md text-sm">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>← RISK</span>
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <span>SAFE →</span>
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Card */}
      {currentCard && (
        <div
          className={cn(
            "glass-card p-6 w-full max-w-md min-h-[200px] flex items-center justify-center text-center transition-all duration-300 transform",
            swipeDirection === 'left' && "-translate-x-full opacity-0 rotate-[-30deg] scale-90",
            swipeDirection === 'right' && "translate-x-full opacity-0 rotate-[30deg] scale-90",
            !swipeDirection && "animate-fade-in-up",
            feedback === 'correct' && "border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)] scale-105",
            feedback === 'wrong' && "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-95 animate-shake"
          )}
        >
          <p className="text-xl font-semibold tracking-tight">{currentCard.text}</p>
        </div>
      )}

      {/* Feedback Indicator */}
      {feedback && (
        <div className={cn(
          "fixed inset-0 pointer-events-none flex items-center justify-center",
          feedback === 'correct' ? "bg-green-500/20" : "bg-red-500/20"
        )}>
          {feedback === 'correct' ? (
            <CheckCircle className="w-32 h-32 text-green-400 animate-scale-in" />
          ) : (
            <XCircle className="w-32 h-32 text-red-400 animate-scale-in" />
          )}
          <ParticleEffect
            trigger={particleTrigger > 0}
            type={feedback === 'correct' ? 'success' : 'error'}
          />
        </div>
      )}

      <ScreenFlash trigger={flashTrigger > 0} color={feedback === 'correct' ? 'green' : 'red'} />

      {/* Swipe Buttons */}
      <div className="flex gap-6 w-full max-w-md">
        <button
          onClick={() => handleSwipe('left')}
          disabled={!isActive}
          className="flex-1 py-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
          RISK
        </button>
        <button
          onClick={() => handleSwipe('right')}
          disabled={!isActive}
          className="flex-1 py-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white font-bold text-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          <CheckCircle className="w-10 h-10 mx-auto mb-2" />
          SAFE
        </button>
      </div>
    </div>
  );
}

// Main Display Component
interface RiskDefenderMainDisplayProps {
  shieldHealth: number;
  timeRemaining: number;
  totalCorrect: number;
  totalWrong: number;
}

export function RiskDefenderMainDisplay({
  shieldHealth,
  timeRemaining,
  totalCorrect,
  totalWrong
}: RiskDefenderMainDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      {/* Timer */}
      <div className={cn(
        "text-6xl font-bold font-display mb-8",
        timeRemaining <= 10 && "text-red-400 animate-pulse"
      )}>
        {formatTime(timeRemaining)}
      </div>

      {/* Ambulance with Shield */}
      <div className="relative">
        {/* Shield Visual */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-8 transition-all duration-500",
            shieldHealth > 70 ? "border-green-400 shadow-[0_0_60px_rgba(34,197,94,0.6)]" :
              shieldHealth > 40 ? "border-yellow-400 shadow-[0_0_60px_rgba(234,179,8,0.6)]" :
                "border-red-400 shadow-[0_0_60px_rgba(239,68,68,0.6)] animate-pulse"
          )}
          style={{
            transform: 'scale(1.5)',
            opacity: shieldHealth / 100,
          }}
        />

        {/* Ambulance Icon */}
        <div className="text-[120px] relative z-10">🚑</div>

        {/* Cracks overlay when shield is low */}
        {shieldHealth < 50 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-full h-full absolute" viewBox="0 0 100 100">
              <path
                d="M30,20 L35,40 L25,60 M45,10 L50,35 L40,50 M70,15 L65,45 L75,70"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                fill="none"
                style={{ opacity: (50 - shieldHealth) / 50 }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Shield Health Bar */}
      <div className="w-full max-w-2xl mt-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" /> Team Shield
          </span>
          <span className="text-3xl font-bold">{shieldHealth}%</span>
        </div>
        <div className="h-8 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              shieldHealth > 70 ? "bg-gradient-to-r from-green-400 to-green-600" :
                shieldHealth > 40 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
                  "bg-gradient-to-r from-red-400 to-red-600"
            )}
            style={{ width: `${shieldHealth}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-12 mt-8">
        <div className="text-center">
          <div className="text-5xl font-bold text-green-400">{totalCorrect}</div>
          <div className="text-lg text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Correct
          </div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-red-400">{totalWrong}</div>
          <div className="text-lg text-muted-foreground flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Wrong
          </div>
        </div>
      </div>
    </div>
  );
}

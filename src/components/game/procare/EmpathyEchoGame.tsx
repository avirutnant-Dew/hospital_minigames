import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { EMPATHY_SCENARIOS, EmpathyScenario, PRO_CARE_CONFIG } from './types';
import { gameAudio } from '@/lib/gameAudio';
import { ScreenFlash, ParticleEffect } from '@/components/game/effects';

interface EmpathyEchoGameProps {
  onVote: (isCorrect: boolean) => void;
  csiScore: number;
  timeRemaining: number;
  isActive: boolean;
  currentScenario: EmpathyScenario | null;
}

export function EmpathyEchoGame({ 
  onVote, 
  csiScore, 
  timeRemaining, 
  isActive,
  currentScenario
}: EmpathyEchoGameProps) {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(0);

  // Reset when scenario changes
  useEffect(() => {
    setSelectedOption(null);
    setHasVoted(false);
  }, [currentScenario?.id]);

  const handleVote = (option: 'A' | 'B') => {
    if (hasVoted || !currentScenario || !isActive) return;

    setSelectedOption(option);
    setHasVoted(true);
    
    const isCorrect = option === currentScenario.correctOption;
    setFlashTrigger(f => f + 1);
    
    if (isCorrect) {
      gameAudio.playSuccess();
    } else {
      gameAudio.playError();
    }
    
    onVote(isCorrect);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentScenario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <MessageCircle className="w-16 h-16 text-pink-400 animate-pulse mb-4" />
        <p className="text-muted-foreground">กำลังโหลดสถานการณ์...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          <span className="text-xl font-bold text-pink-400">CSI: {csiScore}%</span>
        </div>
        <div className={cn(
          "text-3xl font-bold font-display",
          timeRemaining <= 10 && "text-red-400 animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Scenario Card */}
      <div className="glass-card p-6 w-full bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-pink-500/20">
            <MessageCircle className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <span className="text-sm text-pink-400 font-medium">สถานการณ์</span>
            <p className="text-lg font-medium mt-1">{currentScenario.situation}</p>
          </div>
        </div>
      </div>

      {/* Voting Options */}
      <div className="w-full space-y-3">
        <button
          onClick={() => handleVote('A')}
          disabled={hasVoted || !isActive}
          className={cn(
            "w-full p-4 rounded-xl border-2 text-left transition-all",
            selectedOption === 'A' 
              ? currentScenario.correctOption === 'A'
                ? "border-green-500 bg-green-500/20"
                : "border-red-500 bg-red-500/20"
              : "border-border bg-card hover:border-pink-400 hover:bg-pink-500/10",
            hasVoted && "opacity-70"
          )}
        >
          <span className="font-bold text-pink-400 mr-2">A.</span>
          {currentScenario.optionA}
        </button>

        <button
          onClick={() => handleVote('B')}
          disabled={hasVoted || !isActive}
          className={cn(
            "w-full p-4 rounded-xl border-2 text-left transition-all",
            selectedOption === 'B' 
              ? currentScenario.correctOption === 'B'
                ? "border-green-500 bg-green-500/20"
                : "border-red-500 bg-red-500/20"
              : "border-border bg-card hover:border-pink-400 hover:bg-pink-500/10",
            hasVoted && "opacity-70"
          )}
        >
          <span className="font-bold text-pink-400 mr-2">B.</span>
          {currentScenario.optionB}
        </button>
      </div>

      {/* Feedback */}
      {hasVoted && (
        <div className={cn(
          "p-4 rounded-xl text-center",
          selectedOption === currentScenario.correctOption
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        )}>
          {selectedOption === currentScenario.correctOption ? (
            <div className="flex items-center justify-center gap-2">
              <ThumbsUp className="w-6 h-6" />
              <span className="font-bold">ถูกต้อง! นี่คือ Hospitality ที่ดี</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ThumbsDown className="w-6 h-6" />
              <span className="font-bold">ลองคิดใหม่ ควรแสดง Empathy มากกว่านี้</span>
            </div>
          )}
        </div>
      )}

      <ScreenFlash 
        trigger={flashTrigger > 0} 
        color={selectedOption === currentScenario?.correctOption ? 'green' : 'red'} 
      />
    </div>
  );
}

// Main Display Component
interface EmpathyEchoMainDisplayProps {
  currentScenario: EmpathyScenario | null;
  votesA: number;
  votesB: number;
  csiScore: number;
  timeRemaining: number;
  scenarioTimeLeft: number;
}

export function EmpathyEchoMainDisplay({ 
  currentScenario, 
  votesA, 
  votesB, 
  csiScore, 
  timeRemaining,
  scenarioTimeLeft
}: EmpathyEchoMainDisplayProps) {
  const totalVotes = votesA + votesB;
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 0;
  const percentB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-950/50 to-purple-950/30 rounded-3xl">
      {/* Timer */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-8">
        <div className={cn(
          "text-5xl font-bold font-display",
          timeRemaining <= 10 && "text-red-400 animate-pulse"
        )}>
          {formatTime(timeRemaining)}
        </div>
        
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Scenario Timer</div>
          <div className={cn(
            "text-4xl font-bold font-display",
            scenarioTimeLeft <= 3 && "text-yellow-400 animate-pulse"
          )}>
            {scenarioTimeLeft}s
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

      {/* Scenario */}
      {currentScenario && (
        <div className="glass-card p-8 w-full max-w-4xl mb-8 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-pink-500/20">
              <MessageCircle className="w-10 h-10 text-pink-400" />
            </div>
            <div>
              <span className="text-lg text-pink-400 font-medium">สถานการณ์ลูกค้า</span>
              <p className="text-2xl font-medium mt-2">{currentScenario.situation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Voting Results */}
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-pink-400 w-8">A</span>
          <div className="flex-1 h-12 bg-muted rounded-xl overflow-hidden relative">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                currentScenario?.correctOption === 'A' 
                  ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                  : "bg-gradient-to-r from-pink-500 to-rose-400"
              )}
              style={{ width: `${percentA}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-bold text-xl">
              {votesA} votes ({percentA}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-pink-400 w-8">B</span>
          <div className="flex-1 h-12 bg-muted rounded-xl overflow-hidden relative">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                currentScenario?.correctOption === 'B' 
                  ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                  : "bg-gradient-to-r from-pink-500 to-rose-400"
              )}
              style={{ width: `${percentB}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-bold text-xl">
              {votesB} votes ({percentB}%)
            </span>
          </div>
        </div>
      </div>

      {/* Total Voters */}
      <div className="flex items-center gap-2 mt-6 text-muted-foreground">
        <Users className="w-5 h-5" />
        <span>{totalVotes} team members voted</span>
      </div>
    </div>
  );
}

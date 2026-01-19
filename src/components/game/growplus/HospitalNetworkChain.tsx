import { useEffect, useState } from 'react';
import { ParticleEffect } from '@/components/game/effects/VisualEffects';
import { gameAudio } from '@/lib/gameAudio';
import { PATIENT_PATHWAYS, GAME_CONFIG } from './types';
import { cn } from '@/lib/utils';

interface HospitalNetworkChainProps {
  gameId: string;
  teamId: string | null;
  playerNickname: string;
  onScore: (score: number, playerName: string) => void;
  durationSeconds: number;
  playerCount: number;
}

export function HospitalNetworkChain({
  gameId,
  teamId,
  playerNickname,
  onScore,
  durationSeconds,
  playerCount,
}: HospitalNetworkChainProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [currentPathway, setCurrentPathway] = useState(PATIENT_PATHWAYS[0]);
  const [sequenceProgress, setSequenceProgress] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [completedSequences, setCompletedSequences] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [lastTappedDept, setLastTappedDept] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<Array<{ player: string; sequences: number }>>([]);

  // Sync timeLeft with durationSeconds from controller
  useEffect(() => {
    if (durationSeconds > 0) {
      setTimeLeft(durationSeconds);
    }
  }, [durationSeconds]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Initialize with random pathway
  useEffect(() => {
    const randomPathway = PATIENT_PATHWAYS[Math.floor(Math.random() * PATIENT_PATHWAYS.length)];
    setCurrentPathway(randomPathway);
  }, []);

  // Simulate leaderboard updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard([
        { player: playerNickname, sequences: completedSequences },
        { player: 'Other Player', sequences: Math.max(0, completedSequences - 1) },
        { player: 'Another Player', sequences: Math.max(0, completedSequences - 2) },
      ].sort((a, b) => b.sequences - a.sequences));
    }, 2000);

    return () => clearInterval(interval);
  }, [completedSequences, playerNickname]);

  const sequenceLength = GAME_CONFIG.HOSPITAL_NETWORK.sequenceLength;
  const scorePerSequence = GAME_CONFIG.HOSPITAL_NETWORK.scorePerSequence;

  const onDepartmentTap = (deptIndex: number) => {
    if (timeLeft <= 0) return;

    const nextExpectedIndex = sequenceProgress.length;

    if (deptIndex === nextExpectedIndex) {
      // Correct tap!
      gameAudio.playUIClick();
      const newProgress = [...sequenceProgress, deptIndex];
      setSequenceProgress(newProgress);
      setLastTappedDept(currentPathway.departments[deptIndex].id);
      setFeedback(`✓ ${currentPathway.departments[deptIndex].name}`);

      if (newProgress.length === sequenceLength) {
        // Sequence completed!
        const reward = scorePerSequence;
        setTotalScore((prev) => prev + reward);
        setCompletedSequences((prev) => prev + 1);
        onScore(reward, playerNickname);

        gameAudio.playTeamSuccess();
        gameAudio.playMilestoneFanfare();
        setFeedback(`🎉 Complete! +${(reward / 1000000).toFixed(1)}M`);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 800);

        // Reset sequence
        setTimeout(() => {
          setSequenceProgress([]);
          setFeedback('');
          // Optionally switch to new pathway
          if (Math.random() > 0.5) {
            const newPathway = PATIENT_PATHWAYS[Math.floor(Math.random() * PATIENT_PATHWAYS.length)];
            setCurrentPathway(newPathway);
          }
        }, 800);
      } else {
        // Show progress
        setTimeout(() => setFeedback(''), 1000);
      }
    } else {
      // Wrong tap - reset sequence
      gameAudio.playError();
      setFeedback('❌ Wrong order! Restarting...');
      setSequenceProgress([]);

      setTimeout(() => setFeedback(''), 1200);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-lg p-6 flex flex-col gap-4 glass-card">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-orbitron font-bold text-white">🏥 Hospital Network</h2>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-cyan-500/30 text-cyan-200 rounded text-sm font-mono">
              {playerCount} players
            </span>
            <span className="px-2 py-1 bg-emerald-500/30 text-emerald-200 rounded text-sm font-mono">
              {completedSequences} sequences
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-300 font-orbitron">
            {(totalScore / 1000000).toFixed(1)}M
          </div>
          <div className={cn(
            'text-lg font-bold font-orbitron',
            timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-cyan-300'
          )}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Current Pathway Info */}
      <div className="bg-black/30 rounded-lg p-3 border border-purple-500/50">
        <div className="text-sm text-purple-200 font-kanit">{currentPathway.name}</div>
        <div className="text-xs text-purple-300 text-opacity-70">{currentPathway.description}</div>
      </div>

      {/* Main Pathway Chain */}
      <div className="flex-1 flex items-center justify-center gap-2 py-6 min-h-[200px]">
        {currentPathway.departments.map((dept, idx) => (
          <div key={dept.id} className="flex items-center">
            <button
              onClick={() => onDepartmentTap(idx)}
              disabled={timeLeft <= 0}
              className={cn(
                'w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed',
                sequenceProgress.includes(idx)
                  ? 'bg-emerald-500/40 border-2 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/50'
                  : idx === sequenceProgress.length
                  ? 'bg-cyan-500/30 border-2 border-cyan-400 hover:scale-115 shadow-lg shadow-cyan-500/30 animate-pulse'
                  : 'bg-gray-700/40 border-2 border-gray-600',
                lastTappedDept === dept.id && 'animate-bounce'
              )}>
              <span className="text-2xl">{dept.icon}</span>
              <span className="text-xs font-kanit text-white text-center leading-tight">{dept.name}</span>
            </button>

            {idx < currentPathway.departments.length - 1 && (
              <div className={cn(
                'w-8 h-1 mx-1 rounded transition-all',
                sequenceProgress.includes(idx) && sequenceProgress.includes(idx + 1)
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                  : 'bg-gray-600'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Feedback & Status */}
      {feedback && (
        <div className="text-center animate-bounce">
          <p className="text-xl font-bold font-orbitron text-cyan-300">{feedback}</p>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex gap-1 justify-center py-2">
        {Array.from({ length: sequenceLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-8 rounded transition-all',
              i < sequenceProgress.length ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-gray-600'
            )}
          />
        ))}
      </div>

      {/* Quick Leaderboard */}
      <div className="bg-black/40 rounded p-2 border border-purple-500/30">
        <div className="text-xs text-purple-300 font-bold mb-1">Pathways Completed</div>
        <div className="space-y-1">
          {leaderboard.slice(0, 3).map((entry, i) => (
            <div key={i} className="flex justify-between text-xs text-purple-200">
              <span className="font-kanit">{entry.player}</span>
              <span className="font-mono text-cyan-300">{entry.sequences}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Particles */}
      {showParticles && <ParticleEffect trigger={true} type="victory" />}
    </div>
  );
}

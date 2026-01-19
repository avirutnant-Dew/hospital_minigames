import { useEffect, useState } from 'react';
import { ParticleEffect } from '@/components/game/effects/VisualEffects';
import { gameAudio } from '@/lib/gameAudio';
import { PATIENT_PATHWAYS, GAME_CONFIG, PatientPathway } from './types';
import { cn } from '@/lib/utils';

interface DepartmentEfficiencyChainProps {
  gameId: string;
  teamId: string | null;
  playerNickname: string;
  onScore: (score: number, playerName: string) => void;
  durationSeconds: number;
  playerCount: number;
}

export function DepartmentEfficiencyChain({
  gameId,
  teamId,
  playerNickname,
  onScore,
  durationSeconds,
  playerCount,
}: DepartmentEfficiencyChainProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [currentPathways, setCurrentPathways] = useState<PatientPathway[]>(PATIENT_PATHWAYS);
  const [pathwayProgress, setPathwayProgress] = useState<Record<string, number[]>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [completedPathways, setCompletedPathways] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [multiplier, setMultiplier] = useState(1);
  const [leaderboard, setLeaderboard] = useState<Array<{ player: string; pathways: number }>>([]);

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

  // Initialize pathways with empty progress
  useEffect(() => {
    const initialProgress: Record<string, number[]> = {};
    PATIENT_PATHWAYS.forEach((p) => {
      initialProgress[p.id] = [];
    });
    setPathwayProgress(initialProgress);
  }, []);

  // Increase multiplier for consecutive pathways
  useEffect(() => {
    const newMultiplier = Math.min(1 + Math.floor(completedPathways / 2) * 0.5, 3);
    setMultiplier(newMultiplier);
  }, [completedPathways]);

  // Simulate leaderboard updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard([
        { player: playerNickname, pathways: completedPathways },
        { player: 'Other Player', pathways: Math.max(0, completedPathways - 1) },
        { player: 'Another Player', pathways: Math.max(0, completedPathways - 2) },
      ].sort((a, b) => b.pathways - a.pathways));
    }, 2000);

    return () => clearInterval(interval);
  }, [completedPathways, playerNickname]);

  const onDepartmentTap = (pathwayId: string, deptIndex: number) => {
    if (timeLeft <= 0) return;

    const currentProgress = pathwayProgress[pathwayId] || [];
    const nextExpectedIndex = currentProgress.length;
    const pathway = PATIENT_PATHWAYS.find((p) => p.id === pathwayId);

    if (!pathway) return;

    if (deptIndex === nextExpectedIndex) {
      // Correct tap!
      gameAudio.playUIClick();
      const newProgress = [...currentProgress, deptIndex];

      setPathwayProgress((prev) => ({
        ...prev,
        [pathwayId]: newProgress,
      }));

      setFeedback(`✓ ${pathway.departments[deptIndex].name}`);

      if (newProgress.length === pathway.departments.length) {
        // Pathway completed!
        const baseReward = pathway.baseReward;
        const reward = Math.round(baseReward * multiplier);
        setTotalScore((prev) => prev + reward);
        setCompletedPathways((prev) => prev + 1);
        onScore(reward, playerNickname);

        gameAudio.playTeamSuccess();
        gameAudio.playMilestoneFanfare();
        setFeedback(`🎉 ${pathway.name} Complete! +${(reward / 1000000).toFixed(1)}M`);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 1000);

        // Reset pathway
        setTimeout(() => {
          setPathwayProgress((prev) => ({
            ...prev,
            [pathwayId]: [],
          }));
          setFeedback('');
        }, 1000);
      } else {
        // Show progress
        setTimeout(() => setFeedback(''), 1000);
      }
    } else {
      // Wrong tap - reset this pathway
      gameAudio.playError();
      setFeedback(`❌ Wrong order! Restarting ${pathway.name}...`);

      setPathwayProgress((prev) => ({
        ...prev,
        [pathwayId]: [],
      }));

      setTimeout(() => setFeedback(''), 1200);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-orange-900 via-red-900 to-purple-900 rounded-lg p-6 flex flex-col gap-4 glass-card overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-orbitron font-bold text-white">🏥 Department Efficiency</h2>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-cyan-500/30 text-cyan-200 rounded text-sm font-mono">
              {playerCount} players
            </span>
            <span className="px-2 py-1 bg-orange-500/30 text-orange-200 rounded text-sm font-mono">
              x{multiplier.toFixed(1)} multiplier
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

      {/* Three Parallel Pathways */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {currentPathways.map((pathway) => {
          const progress = pathwayProgress[pathway.id] || [];
          const completionPercent = (progress.length / pathway.departments.length) * 100;

          return (
            <div key={pathway.id} className="bg-black/30 rounded-lg p-3 border border-red-500/30 flex flex-col gap-2">
              {/* Pathway Header */}
              <div className="space-y-1">
                <div className="text-sm font-bold text-red-200 font-kanit line-clamp-1">{pathway.name}</div>
                <div className="h-2 bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Department Sequence */}
              <div className="flex flex-col gap-2">
                {pathway.departments.map((dept, idx) => (
                  <button
                    key={dept.id}
                    onClick={() => onDepartmentTap(pathway.id, idx)}
                    disabled={timeLeft <= 0}
                    className={cn(
                      'w-full py-2 px-2 rounded flex items-center gap-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed',
                      progress.includes(idx)
                        ? 'bg-emerald-500/40 border border-emerald-400 text-emerald-100'
                        : idx === progress.length
                        ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-100 hover:bg-cyan-500/50 animate-pulse'
                        : 'bg-gray-700/40 border border-gray-600 text-gray-400'
                    )}>
                    <span className="text-lg">{dept.icon}</span>
                    <span className="text-xs font-kanit flex-1 text-left">{dept.name}</span>
                    {progress.includes(idx) && <span className="text-sm">✓</span>}
                  </button>
                ))}
              </div>

              {/* Reward Info */}
              <div className="text-xs text-orange-300 text-center pt-1 border-t border-red-500/20">
                +{(pathway.baseReward / 1000000).toFixed(0)}M × {multiplier.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="text-center animate-bounce bg-black/50 py-2 rounded border border-cyan-500/50">
          <p className="text-sm font-bold font-orbitron text-cyan-300">{feedback}</p>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-black/40 rounded p-2 border border-red-500/30 sticky bottom-0">
        <div className="text-xs text-red-300 font-bold mb-1">Pathways Completed</div>
        <div className="space-y-1">
          {leaderboard.slice(0, 3).map((entry, i) => (
            <div key={i} className="flex justify-between text-xs text-red-200">
              <span className="font-kanit">{entry.player}</span>
              <span className="font-mono text-orange-300">{entry.pathways}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Particles */}
      {showParticles && <ParticleEffect trigger={true} type="victory" />}
    </div>
  );
}

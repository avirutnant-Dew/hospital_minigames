import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GrowPlusGame, GrowPlusScore, GrowPlusGameType, selectRandomGame, GAME_CONFIG } from './types';

interface UseGrowPlusGameProps {
  teamId?: string;
  playerNickname?: string;
}

export function useGrowPlusGame({ teamId, playerNickname }: UseGrowPlusGameProps) {
  const [activeGame, setActiveGame] = useState<GrowPlusGame | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentScores, setRecentScores] = useState<GrowPlusScore[]>([]);

  // Start a new GROW PLUS game
  const startGame = useCallback(async (gameType?: GrowPlusGameType) => {
    if (!teamId) return null;
    
    setIsLoading(true);
    const selectedType = gameType || selectRandomGame();
    const duration = GAME_CONFIG[selectedType].duration;
    const endsAt = new Date(Date.now() + duration * 1000).toISOString();

    const { data, error } = await supabase
      .from('grow_plus_games')
      .insert({
        game_type: selectedType,
        team_id: teamId,
        ends_at: endsAt,
        is_active: true,
        total_score: 0,
        combo_multiplier: 1,
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error starting game:', error);
      return null;
    }

    setActiveGame(data as GrowPlusGame);
    setTotalScore(0);
    setTimeRemaining(duration);
    return data as GrowPlusGame;
  }, [teamId]);

  // Record a player action (tap, link, boost)
  const recordAction = useCallback(async (actionType: string, scoreValue: number) => {
    if (!activeGame || !playerNickname) return;

    const { error } = await supabase
      .from('grow_plus_scores')
      .insert({
        game_id: activeGame.id,
        player_nickname: playerNickname,
        team_id: teamId,
        action_type: actionType,
        score_value: scoreValue,
      });

    if (error) {
      console.error('Error recording action:', error);
    }
  }, [activeGame, playerNickname, teamId]);

  // End the current game
  const endGame = useCallback(async () => {
    if (!activeGame) return;

    await supabase
      .from('grow_plus_games')
      .update({ is_active: false, total_score: totalScore })
      .eq('id', activeGame.id);

    setActiveGame(null);
    setTimeRemaining(0);
  }, [activeGame, totalScore]);

  // Fetch active game for this team
  useEffect(() => {
    if (!teamId) return;

    const fetchActiveGame = async () => {
      const { data } = await supabase
        .from('grow_plus_games')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveGame(data as GrowPlusGame);
        const remaining = Math.max(0, Math.floor((new Date(data.ends_at).getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
        setTotalScore(data.total_score);
      }
    };

    fetchActiveGame();
  }, [teamId]);

  // Subscribe to real-time score updates
  useEffect(() => {
    if (!activeGame) return;

    const channel = supabase
      .channel(`grow-plus-${activeGame.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grow_plus_scores',
          filter: `game_id=eq.${activeGame.id}`,
        },
        (payload) => {
          const newScore = payload.new as GrowPlusScore;
          setTotalScore((prev) => prev + newScore.score_value);
          setRecentScores((prev) => [newScore, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGame?.id]);

  // Timer countdown
  useEffect(() => {
    if (!activeGame || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame, timeRemaining, endGame]);

  return {
    activeGame,
    totalScore,
    timeRemaining,
    isLoading,
    recentScores,
    startGame,
    recordAction,
    endGame,
  };
}

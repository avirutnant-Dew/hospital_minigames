import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SafeActGame, SafeActGameType, selectRandomSafeActGame, SAFE_ACT_CONFIG } from './types';

interface UseSafeActGameProps {
  teamId?: string;
  playerNickname?: string;
}

export function useSafeActGame({ teamId, playerNickname }: UseSafeActGameProps) {
  const [activeGame, setActiveGame] = useState<SafeActGame | null>(null);
  const [shieldHealth, setShieldHealth] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);

  const startGame = useCallback(async (gameType?: SafeActGameType) => {
    setIsLoading(true);
    const selectedType = gameType || selectRandomSafeActGame();
    const duration = SAFE_ACT_CONFIG[selectedType].duration;
    const endsAt = new Date(Date.now() + duration * 1000).toISOString();

    const { data, error } = await supabase
      .from('safe_act_games')
      .insert({
        game_type: selectedType,
        team_id: teamId || null,
        ends_at: endsAt,
        is_active: true,
        shield_health: 100,
        total_correct: 0,
        total_wrong: 0,
        hazards_cleared: 0,
        combo_multiplier: 1,
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error starting game:', error);
      return null;
    }

    setActiveGame(data as SafeActGame);
    setShieldHealth(100);
    setTimeRemaining(duration);
    setTotalCorrect(0);
    setTotalWrong(0);
    return data as SafeActGame;
  }, [teamId]);

  const recordAction = useCallback(async (
    actionType: string, 
    isCorrect: boolean, 
    scoreValue: number,
    zoneId?: number
  ) => {
    if (!activeGame || !playerNickname) return;

    await supabase
      .from('safe_act_logs')
      .insert({
        game_id: activeGame.id,
        player_nickname: playerNickname,
        team_id: teamId,
        action_type: actionType,
        is_correct: isCorrect,
        zone_id: zoneId ?? null,
        score_value: scoreValue,
      });
  }, [activeGame, playerNickname, teamId]);

  const updateShieldHealth = useCallback(async (newHealth: number) => {
    if (!activeGame) return;
    
    const clampedHealth = Math.max(0, Math.min(100, newHealth));
    await supabase
      .from('safe_act_games')
      .update({ shield_health: clampedHealth })
      .eq('id', activeGame.id);
  }, [activeGame]);

  const endGame = useCallback(async () => {
    if (!activeGame) return;

    await supabase
      .from('safe_act_games')
      .update({ 
        is_active: false,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
      })
      .eq('id', activeGame.id);

    setActiveGame(null);
    setTimeRemaining(0);
  }, [activeGame, totalCorrect, totalWrong]);

  // Fetch active game on mount
  useEffect(() => {
    const fetchActiveGame = async () => {
      const { data } = await supabase
        .from('safe_act_games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveGame(data as SafeActGame);
        setShieldHealth(data.shield_health);
        const remaining = Math.max(0, Math.floor((new Date(data.ends_at).getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
        setTotalCorrect(data.total_correct);
        setTotalWrong(data.total_wrong);
      }
    };

    fetchActiveGame();
  }, []);

  // Subscribe to game updates
  useEffect(() => {
    const channel = supabase
      .channel('safe-act-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'safe_act_games',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const game = payload.new as SafeActGame;
            if (game.is_active) {
              setActiveGame(game);
              setShieldHealth(game.shield_health);
              const remaining = Math.max(0, Math.floor((new Date(game.ends_at).getTime() - Date.now()) / 1000));
              setTimeRemaining(remaining);
            } else if (payload.eventType === 'UPDATE' && !game.is_active && activeGame?.id === game.id) {
              setActiveGame(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGame?.id]);

  // Subscribe to log updates for real-time stats
  useEffect(() => {
    if (!activeGame) return;

    const channel = supabase
      .channel(`safe-act-logs-${activeGame.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'safe_act_logs',
          filter: `game_id=eq.${activeGame.id}`,
        },
        (payload) => {
          const log = payload.new;
          if (log.is_correct) {
            setTotalCorrect((prev) => prev + 1);
          } else {
            setTotalWrong((prev) => prev + 1);
          }
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
    shieldHealth,
    timeRemaining,
    isLoading,
    totalCorrect,
    totalWrong,
    startGame,
    recordAction,
    updateShieldHealth,
    endGame,
  };
}

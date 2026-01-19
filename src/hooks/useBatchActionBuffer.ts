import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BatchAction {
  actionType: string;
  scoreValue: number;
}

interface UseBatchActionBufferProps {
  gameId?: string;
  gameType: 'grow_plus' | 'safe_act' | 'pro_care';
  playerNickname?: string;
  teamId?: string;
  batchSize?: number; // Default: 5
  flushIntervalMs?: number; // Default: 2000
  enabled?: boolean; // Whether buffering is enabled
}

export function useBatchActionBuffer({
  gameId,
  gameType,
  playerNickname,
  teamId,
  batchSize = 5,
  flushIntervalMs = 2000,
  enabled = true,
}: UseBatchActionBufferProps) {
  const [buffer, setBuffer] = useState<BatchAction[]>([]);
  const [totalBatchesFlushed, setTotalBatchesFlushed] = useState(0);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlushTimeRef = useRef<number>(Date.now());
  
  // Use ref to store latest config values
  const configRef = useRef({ gameId, gameType, playerNickname, teamId, enabled });
  
  useEffect(() => {
    configRef.current = { gameId, gameType, playerNickname, teamId, enabled };
  }, [gameId, gameType, playerNickname, teamId, enabled]);

  // Flush buffer to database
  const flushBuffer = useCallback(async (actions: BatchAction[]) => {
    const { gameId: gId, playerNickname: pName, gameType: gType, teamId: tId, enabled: isEnabled } = configRef.current;
    
    if (!gId || !pName || !isEnabled) return;

    if (actions.length === 0) return;

    const totalScore = actions.reduce((sum, action) => sum + action.scoreValue, 0);
    const tableName = `${gType}_scores`;

    try {
      await supabase.from(tableName).insert({
        game_id: gId,
        player_nickname: pName,
        team_id: tId || null,
        action_type: actions[0].actionType,
        score_value: totalScore,
        batch_size: actions.length,
      });

      lastFlushTimeRef.current = Date.now();
      setTotalBatchesFlushed((prev) => prev + 1);
    } catch (error) {
      console.error(`Error flushing batch to ${tableName}:`, error);
    }
  }, []);

  // Add action to buffer
  const addAction = useCallback((actionType: string, scoreValue: number) => {
    if (!configRef.current.enabled) {
      // If disabled, flush immediately
      flushBuffer([{ actionType, scoreValue }]);
      return;
    }

    setBuffer((prev) => {
      const newBuffer = [...prev, { actionType, scoreValue }];

      // If buffer reaches batchSize, flush immediately
      if (newBuffer.length >= batchSize) {
        flushBuffer(newBuffer);
        return [];
      }

      // If no timer set, start one
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          setBuffer((current) => {
            if (current.length > 0) {
              flushBuffer(current);
            }
            flushTimerRef.current = null;
            return [];
          });
        }, flushIntervalMs);
      }

      return newBuffer;
    });
  }, [batchSize, flushIntervalMs, flushBuffer]);

  // Manual flush
  const manualFlush = useCallback(() => {
    setBuffer((current) => {
      if (current.length > 0) {
        flushBuffer(current);
      }
      return [];
    });
  }, [flushBuffer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  // Force flush on game end
  const forceFlush = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    manualFlush();
  }, [manualFlush]);

  return {
    addAction,
    manualFlush,
    forceFlush,
    bufferSize: buffer.length,
    totalBatchesFlushed,
  };
}

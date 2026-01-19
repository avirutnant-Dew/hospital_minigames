-- Add pending challenge fields to game_state
ALTER TABLE public.game_state 
ADD COLUMN pending_challenge_title TEXT NULL,
ADD COLUMN pending_challenge_game_type TEXT NULL,
ADD COLUMN pending_challenge_team_id UUID NULL REFERENCES public.teams(id);
-- Update grow_plus_games check constraint to include new game types
ALTER TABLE public.grow_plus_games 
DROP CONSTRAINT IF EXISTS grow_plus_games_game_type_check;

ALTER TABLE public.grow_plus_games 
ADD CONSTRAINT grow_plus_games_game_type_check 
CHECK (game_type IN ('REVENUE_TAP', 'REFERRAL_LINK', 'SBU_COMBO', 'HOSPITAL_NETWORK', 'DEPARTMENT_EFFICIENCY'));

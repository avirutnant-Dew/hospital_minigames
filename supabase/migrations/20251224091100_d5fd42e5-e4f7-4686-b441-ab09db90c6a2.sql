-- Add last_dice_value column to game_state for dice sync between PlayerView and MainStage
ALTER TABLE public.game_state 
ADD COLUMN last_dice_value INTEGER DEFAULT NULL;
-- Create grow_plus_games table to track active mini-games
CREATE TABLE public.grow_plus_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL CHECK (game_type IN ('REVENUE_TAP', 'REFERRAL_LINK', 'SBU_COMBO')),
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_score BIGINT NOT NULL DEFAULT 0,
  combo_multiplier INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grow_plus_scores table for real-time player actions
CREATE TABLE public.grow_plus_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.grow_plus_games(id) ON DELETE CASCADE,
  player_nickname TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  action_type TEXT NOT NULL,
  score_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grow_plus_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_plus_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for grow_plus_games
CREATE POLICY "Public read access for grow_plus_games" 
ON public.grow_plus_games 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for grow_plus_games" 
ON public.grow_plus_games 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for grow_plus_games" 
ON public.grow_plus_games 
FOR UPDATE 
USING (true);

-- Create policies for grow_plus_scores
CREATE POLICY "Public read access for grow_plus_scores" 
ON public.grow_plus_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for grow_plus_scores" 
ON public.grow_plus_scores 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.grow_plus_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grow_plus_scores;
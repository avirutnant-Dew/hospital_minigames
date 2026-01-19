-- Create pro_care_games table to track active PRO CARE mini-games
CREATE TABLE public.pro_care_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL, -- 'HEART_COLLECTOR', 'EMPATHY_ECHO', 'SMILE_SPARKLE'
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  csi_score INTEGER NOT NULL DEFAULT 70, -- Starts at 70%, target 90%+
  hearts_collected INTEGER NOT NULL DEFAULT 0,
  correct_votes INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  smile_taps INTEGER NOT NULL DEFAULT 0,
  customers_helped INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pro_care_logs table to track individual player actions
CREATE TABLE public.pro_care_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.pro_care_games(id),
  player_nickname TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  action_type TEXT NOT NULL, -- 'HEART_SWIPE', 'EMPATHY_VOTE', 'SMILE_TAP'
  is_correct BOOLEAN NOT NULL DEFAULT true,
  score_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.pro_care_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_care_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for pro_care_games
CREATE POLICY "Public read access for pro_care_games" 
ON public.pro_care_games FOR SELECT USING (true);

CREATE POLICY "Public insert access for pro_care_games" 
ON public.pro_care_games FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for pro_care_games" 
ON public.pro_care_games FOR UPDATE USING (true);

-- RLS policies for pro_care_logs
CREATE POLICY "Public read access for pro_care_logs" 
ON public.pro_care_logs FOR SELECT USING (true);

CREATE POLICY "Public insert access for pro_care_logs" 
ON public.pro_care_logs FOR INSERT WITH CHECK (true);

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pro_care_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pro_care_logs;
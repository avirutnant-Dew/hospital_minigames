-- Create safe_act_games table to track active SAFE ACT mini-games
CREATE TABLE public.safe_act_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL, -- 'RISK_DEFENDER', 'CRITICAL_SYNC', 'HAZARD_POPPER'
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  shield_health INTEGER NOT NULL DEFAULT 100, -- 0-100 percentage
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_wrong INTEGER NOT NULL DEFAULT 0,
  hazards_cleared INTEGER NOT NULL DEFAULT 0,
  combo_multiplier INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safe_act_logs table to track individual player actions
CREATE TABLE public.safe_act_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.safe_act_games(id),
  player_nickname TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  action_type TEXT NOT NULL, -- 'SWIPE_LEFT', 'SWIPE_RIGHT', 'SYNC_TAP', 'HAZARD_TAP'
  is_correct BOOLEAN NOT NULL DEFAULT false,
  zone_id INTEGER, -- For hazard popper grid zones
  score_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.safe_act_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_act_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for safe_act_games
CREATE POLICY "Public read access for safe_act_games" 
ON public.safe_act_games FOR SELECT USING (true);

CREATE POLICY "Public insert access for safe_act_games" 
ON public.safe_act_games FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for safe_act_games" 
ON public.safe_act_games FOR UPDATE USING (true);

-- RLS policies for safe_act_logs
CREATE POLICY "Public read access for safe_act_logs" 
ON public.safe_act_logs FOR SELECT USING (true);

CREATE POLICY "Public insert access for safe_act_logs" 
ON public.safe_act_logs FOR INSERT WITH CHECK (true);

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_act_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_act_logs;
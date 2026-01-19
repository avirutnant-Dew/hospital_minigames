-- Create enum for player roles
CREATE TYPE public.player_role AS ENUM ('CAPTAIN', 'CREW');

-- Create enum for game strategy types
CREATE TYPE public.strategy_type AS ENUM ('GROW_PLUS', 'SAFE_ACT', 'PRO_CARE');

-- Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    current_tile INTEGER NOT NULL DEFAULT 0,
    revenue_score INTEGER NOT NULL DEFAULT 0,
    safety_score INTEGER NOT NULL DEFAULT 0,
    service_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    role player_role NOT NULL DEFAULT 'CREW',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_state table (single row for game control)
CREATE TABLE public.game_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_turn_team_id UUID REFERENCES public.teams(id),
    is_dice_locked BOOLEAN NOT NULL DEFAULT true,
    is_challenge_active BOOLEAN NOT NULL DEFAULT false,
    challenge_type strategy_type,
    challenge_end_time TIMESTAMP WITH TIME ZONE,
    total_revenue BIGINT NOT NULL DEFAULT 0,
    target_revenue BIGINT NOT NULL DEFAULT 1150000000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create emoji_reactions table for real-time reactions
CREATE TABLE public.emoji_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    player_nickname TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_questions table
CREATE TABLE public.challenge_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category strategy_type NOT NULL,
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_ticker table for breaking news
CREATE TABLE public.news_ticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emoji_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_ticker ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for game (public access for this event-based game)
CREATE POLICY "Public read access for teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public update access for teams" ON public.teams FOR UPDATE USING (true);

CREATE POLICY "Public read access for players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public insert access for players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for players" ON public.players FOR UPDATE USING (true);

CREATE POLICY "Public read access for game_state" ON public.game_state FOR SELECT USING (true);
CREATE POLICY "Public update access for game_state" ON public.game_state FOR UPDATE USING (true);

CREATE POLICY "Public read access for emoji_reactions" ON public.emoji_reactions FOR SELECT USING (true);
CREATE POLICY "Public insert access for emoji_reactions" ON public.emoji_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for challenge_questions" ON public.challenge_questions FOR SELECT USING (true);

CREATE POLICY "Public read access for news_ticker" ON public.news_ticker FOR SELECT USING (true);
CREATE POLICY "Public insert access for news_ticker" ON public.news_ticker FOR INSERT WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emoji_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_ticker;

-- Insert initial 5 teams
INSERT INTO public.teams (name, color, current_tile, revenue_score, safety_score, service_score) VALUES
('Team Alpha', '#3B82F6', 0, 0, 0, 0),
('Team Beta', '#10B981', 0, 0, 0, 0),
('Team Gamma', '#F59E0B', 0, 0, 0, 0),
('Team Delta', '#EF4444', 0, 0, 0, 0),
('Team Omega', '#8B5CF6', 0, 0, 0, 0);

-- Insert initial game state
INSERT INTO public.game_state (is_dice_locked, is_challenge_active, total_revenue, target_revenue)
SELECT true, false, 0, 1150000000
WHERE NOT EXISTS (SELECT 1 FROM public.game_state);

-- Insert sample challenge questions
INSERT INTO public.challenge_questions (category, question, options, correct_answer, points) VALUES
('GROW_PLUS', 'การเพิ่มรายได้ที่ยั่งยืนควรเริ่มจากอะไร?', '["ลดต้นทุน", "เพิ่มคุณภาพบริการ", "ขยายสาขา", "โฆษณามากขึ้น"]', 'เพิ่มคุณภาพบริการ', 50),
('SAFE_ACT', 'มาตรการความปลอดภัยที่สำคัญที่สุดคืออะไร?', '["สวมหน้ากาก", "ล้างมือ", "การสื่อสาร", "ทุกข้อถูกต้อง"]', 'ทุกข้อถูกต้อง', 50),
('PRO_CARE', 'หัวใจของการดูแลผู้ป่วยคืออะไร?', '["ความรวดเร็ว", "ความใส่ใจ", "เทคโนโลยี", "ราคาถูก"]', 'ความใส่ใจ', 50);
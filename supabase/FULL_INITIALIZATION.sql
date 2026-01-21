-- ==========================================
-- CONSOLIDATED SUPABASE INITIALIZATION SQL
-- ==========================================
-- This script will create all necessary tables, types, and policies.
-- Run this in your Supabase SQL Editor.

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.player_role AS ENUM ('CAPTAIN', 'CREW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.strategy_type AS ENUM ('GROW_PLUS', 'SAFE_ACT', 'PRO_CARE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Create Base Tables
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    current_tile INTEGER NOT NULL DEFAULT 0,
    revenue_score INTEGER NOT NULL DEFAULT 0,
    safety_score INTEGER NOT NULL DEFAULT 0,
    service_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    role player_role NOT NULL DEFAULT 'CREW',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_turn_team_id UUID REFERENCES public.teams(id),
    is_dice_locked BOOLEAN NOT NULL DEFAULT true,
    is_challenge_active BOOLEAN NOT NULL DEFAULT false,
    challenge_type strategy_type,
    challenge_end_time TIMESTAMP WITH TIME ZONE,
    total_revenue BIGINT NOT NULL DEFAULT 0,
    target_revenue BIGINT NOT NULL DEFAULT 1150000000,
    pending_challenge_game_type TEXT,
    pending_challenge_team_id UUID,
    pending_challenge_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create Mini-Game Tables (Grow Plus)
CREATE TABLE IF NOT EXISTS public.grow_plus_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_score BIGINT NOT NULL DEFAULT 0,
  combo_multiplier INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update/Add the specific GrowPlus constraint
ALTER TABLE public.grow_plus_games DROP CONSTRAINT IF EXISTS grow_plus_games_game_type_check;
ALTER TABLE public.grow_plus_games ADD CONSTRAINT grow_plus_games_game_type_check 
CHECK (game_type IN ('REVENUE_TAP', 'REFERRAL_LINK', 'SBU_COMBO', 'HOSPITAL_NETWORK', 'DEPARTMENT_EFFICIENCY'));

CREATE TABLE IF NOT EXISTS public.grow_plus_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.grow_plus_games(id) ON DELETE CASCADE,
  player_nickname TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  action_type TEXT NOT NULL,
  score_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create Mini-Game Tables (Safe Act)
CREATE TABLE IF NOT EXISTS public.safe_act_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  shield_health INTEGER NOT NULL DEFAULT 100,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_wrong INTEGER NOT NULL DEFAULT 0,
  hazards_cleared INTEGER NOT NULL DEFAULT 0,
  combo_multiplier INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safe_act_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.safe_act_games(id),
  player_nickname TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  action_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  zone_id INTEGER,
  score_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create Mini-Game Tables (Pro Care)
CREATE TABLE IF NOT EXISTS public.pro_care_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  csi_score INTEGER NOT NULL DEFAULT 70,
  hearts_collected INTEGER NOT NULL DEFAULT 0,
  correct_votes INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  smile_taps INTEGER NOT NULL DEFAULT 0,
  customers_helped INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pro_care_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.pro_care_games(id),
  player_nickname TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  action_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT true,
  score_value BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Enable RLS and Realtime
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        -- Basic permissive policy for all tables
        EXECUTE format('DROP POLICY IF EXISTS "Public Full Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public Full Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams, public.game_state, public.grow_plus_games, public.grow_plus_scores, public.safe_act_games, public.safe_act_logs, public.pro_care_games, public.pro_care_logs;

-- 7. Seed Initial Data
INSERT INTO public.teams (name, color, current_tile, revenue_score, safety_score, service_score)
SELECT 'Team Alpha', '#3B82F6', 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Team Alpha');
INSERT INTO public.teams (name, color, current_tile, revenue_score, safety_score, service_score)
SELECT 'Team Beta', '#10B981', 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Team Beta');
INSERT INTO public.teams (name, color, current_tile, revenue_score, safety_score, service_score)
SELECT 'Team Gamma', '#F59E0B', 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Team Gamma');
INSERT INTO public.teams (name, color, current_tile, revenue_score, safety_score, service_score)
SELECT 'Team Delta', '#EF4444', 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Team Delta');
INSERT INTO public.teams (name, color, current_tile, revenue_score, safety_score, service_score)
SELECT 'Team Omega', '#8B5CF6', 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM public.teams WHERE name = 'Team Omega');

CREATE TABLE IF NOT EXISTS public.challenge_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category strategy_type NOT NULL,
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed Challenge Questions
INSERT INTO public.challenge_questions (category, question, options, correct_answer, points)
SELECT category, question, options, correct_answer, points FROM (VALUES 
  -- GROW_PLUS
  ('GROW_PLUS', 'กลยุทธ์ใดที่เน้นการเพิ่มรายได้จากการขยายฐานลูกค้าใหม่?', '{"A": "Referral Link", "B": "Cost Cutting", "C": "Staff Reduction"}'::jsonb, 'A', 1000000),
  ('GROW_PLUS', 'เป้าหมายรายได้ของ Smart Hospital 2026 อยู่ที่เท่าไหร่?', '{"A": "1,000 MB", "B": "1,150 MB", "C": "1,500 MB"}'::jsonb, 'B', 2000000),
  ('GROW_PLUS', 'SBU ย่อมาจากอะไรในเชิงธุรกิจโรงพยาบาล?', '{"A": "Special Business Unit", "B": "Social Build Up", "C": "Strategic Business Unit"}'::jsonb, 'C', 1000000),
  ('GROW_PLUS', 'กลยุทธ์ "Up-selling" ในโรงพยาบาลหมายถึงอะไร?', '{"A": "การแนะนำคูปองตรวจสุขภาพที่ครอบคลุมมากขึ้น", "B": "การลดราคายา", "C": "การปิดวอร์ดที่ไม่ทำกำไร"}'::jsonb, 'A', 1500000),
  ('GROW_PLUS', 'ข้อใดไม่ใช่ส่วนหนึ่งของ Grow+ Strategy?', '{"A": "Revenue Stream Diversification", "B": "Market Expansion", "C": "Energy Saving"}'::jsonb, 'C', 1000000),

  -- SAFE_ACT
  ('SAFE_ACT', 'ข้อใดคือลำดับแรกของความปลอดภัยผู้ป่วย (Patient Safety)?', '{"A": "Identification", "B": "Medication", "C": "Standard Precautions"}'::jsonb, 'A', 1000000),
  ('SAFE_ACT', 'สัญลักษณ์สีเหลืองที่พื้นในโรงพยาบาลมักสื่อถึงอะไร?', '{"A": "ทางด่วน", "B": "ระวังพื้นลื่น/ต่างระดับ", "C": "จุดทิ้งขยะ"}'::jsonb, 'B', 1000000),
  ('SAFE_ACT', 'การล้างมือ 7 ขั้นตอนช่วยลดความเสี่ยงอะไรมากที่สุด?', '{"A": "Infection", "B": "Fall", "C": "Fire"}'::jsonb, 'A', 1500000),
  ('SAFE_ACT', 'เมื่อพบเหตุเพลิงไหม้ สิ่งแรกที่ควรทำคืออะไร?', '{"A": "R - Rescue", "B": "A - Alarm", "C": "C - Confine"}'::jsonb, 'A', 1000000),
  ('SAFE_ACT', 'ความปลอดภัยในการบริหารยา (6 Rights) ข้อใดถูกต้อง?', '{"A": "Right Patient, Right Drug, Right Time", "B": "Right Color, Right Size, Right Price"}'::jsonb, 'A', 2000000),

  -- PRO_CARE
  ('PRO_CARE', 'หัวใจสำคัญของการบริการแบบ ProCare คืออะไร?', '{"A": "Speed Only", "B": "Empathy & Service Excellence", "C": "Cost Reduction"}'::jsonb, 'B', 1000000),
  ('PRO_CARE', 'CSI ย่อมาจากอะไรในเชิงการบริการ?', '{"A": "Customer Satisfaction Index", "B": "Customer Service Improvement", "C": "Client Safety Indicator"}'::jsonb, 'A', 1000000),
  ('PRO_CARE', 'การสร้าง "Wow Experience" ให้ลูกค้าควรเริ่มจากจุดใด?', '{"A": "การรับฟังปัญหา (Active Listening)", "B": "การให้ของแถม", "C": "การเดินหนีเมื่อโดนบ่น"}'::jsonb, 'A', 1500000),
  ('PRO_CARE', 'กลยุทธ์ Smile Sparkle เน้นเรื่องใดมากที่สุด?', '{"A": "การแต่งกาย", "B": "การต้อนรับที่ยิ้มแย้มและเป็นมิตร", "C": "การรักษาด้วยยา"}'::jsonb, 'B', 1000000),
  ('PRO_CARE', 'แนวคิด Patient Experience (PX) ต่างจาก Customer Service อย่างไร?', '{"A": "ไม่ต่างกัน", "B": "PX เน้นความรู้สึกตลอดเส้นทางการรับบริการ", "C": "PX เน้นเฉพาะตอนรอหมอ"}'::jsonb, 'B', 2000000)
) AS v(category, question, options, correct_answer, points)
WHERE NOT EXISTS (SELECT 1 FROM public.challenge_questions);

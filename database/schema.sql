/-- ================================================================
-- INNOVEX Database Schema
-- Complete schema for campus innovation platform
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for AI matchmaking
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================================
-- Core Tables
-- ================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('student', 'mentor', 'investor', 'admin');

-- Startup stages enum
CREATE TYPE startup_stage AS ENUM ('idea', 'mvp', 'revenue', 'funded', 'scaling');

-- Meeting status enum
CREATE TYPE meeting_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Mentorship status enum
CREATE TYPE mentorship_status AS ENUM ('pending', 'active', 'completed', 'declined');

-- Investment pipeline stages enum
CREATE TYPE pipeline_stage AS ENUM ('bookmarked', 'in_talks', 'due_diligence', 'invested', 'passed');

-- Avatar states enum
CREATE TYPE avatar_state AS ENUM ('idle', 'excited', 'running', 'celebrating', 'thinking', 'sad');

-- ================================================================
-- Profiles Table (extends Supabase auth.users)
-- ================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rs_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL,
  avatar_url TEXT,
  avatar_state avatar_state DEFAULT 'idle',
  institution TEXT,
  department TEXT,
  phone_number TEXT,
  bio TEXT,
  skills TEXT[], -- Array of skill strings
  interests TEXT[], -- Array of interest strings
  sdgs INTEGER[], -- Array of SDG numbers (1-17)
  innovation_score INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  last_login_date DATE,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Embedding for AI matchmaking
  embedding vector(384) -- gte-small produces 384-dimensional vectors
);

-- ================================================================
-- Startups Table
-- ================================================================
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  problem_statement TEXT,
  solution TEXT,
  stage startup_stage DEFAULT 'idea',
  domain TEXT, -- e.g., 'FinTech', 'EdTech', 'HealthTech'
  sdg_tags TEXT[], -- SDG alignment
  team_size INTEGER DEFAULT 1,
  funding_raised DECIMAL(12, 2) DEFAULT 0,
  pitch_deck_url TEXT,
  demo_url TEXT,
  github_url TEXT,
  is_active BOOLEAN DEFAULT true,
  milestones JSONB, -- Array of milestone objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Embedding for AI matchmaking
  embedding vector(384)
);

-- ================================================================
-- Matches Table (Mentor-Student Matchmaking)
-- ================================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  compatibility_score DECIMAL(5, 2), -- 0-100 percentage
  reasoning TEXT, -- AI-generated explanation
  status mentorship_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentor_id, student_id, startup_id)
);

-- ================================================================
-- Meetings Table
-- ================================================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link TEXT, -- Google Meet or other video link
  notes TEXT,
  status meeting_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Daily Missions Table
-- ================================================================
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 10,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Missions expire after 24 hours
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Badges Table
-- ================================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB, -- Criteria for earning the badge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- User Badges (Junction Table)
-- ================================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ================================================================
-- Investor Pipeline Table
-- ================================================================
CREATE TABLE investor_pipeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  stage pipeline_stage DEFAULT 'bookmarked',
  notes TEXT,
  investment_amount DECIMAL(12, 2),
  valuation DECIMAL(12, 2),
  equity_percentage DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(investor_id, startup_id)
);

-- ================================================================
-- KPI Cache Table (for Admin Dashboard)
-- ================================================================
CREATE TABLE kpi_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT UNIQUE NOT NULL,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Activity Log Table (for tracking user actions)
-- ================================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'startup_updated', 'mission_completed', 'badge_earned'
  action_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Notifications Table
-- ================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT, -- e.g., 'match', 'meeting', 'mission', 'badge'
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Indexes for Performance
-- ================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_innovation_score ON profiles(innovation_score DESC);
CREATE INDEX idx_profiles_embedding ON profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Startups indexes
CREATE INDEX idx_startups_student_id ON startups(student_id);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_domain ON startups(domain);
CREATE INDEX idx_startups_is_active ON startups(is_active);
CREATE INDEX idx_startups_embedding ON startups USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Matches indexes
CREATE INDEX idx_matches_mentor_id ON matches(mentor_id);
CREATE INDEX idx_matches_student_id ON matches(student_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_compatibility ON matches(compatibility_score DESC);

-- Meetings indexes
CREATE INDEX idx_meetings_mentor_id ON meetings(mentor_id);
CREATE INDEX idx_meetings_mentee_id ON meetings(mentee_id);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status);

-- Missions indexes
CREATE INDEX idx_missions_student_id ON missions(student_id);
CREATE INDEX idx_missions_expires_at ON missions(expires_at);
CREATE INDEX idx_missions_is_completed ON missions(is_completed);

-- Activity log indexes
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Investor pipeline indexes
CREATE INDEX idx_investor_pipeline_investor_id ON investor_pipeline(investor_id);
CREATE INDEX idx_investor_pipeline_startup_id ON investor_pipeline(startup_id);
CREATE INDEX idx_investor_pipeline_stage ON investor_pipeline(stage);

-- ================================================================
-- Row Level Security (RLS) Policies
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Startups RLS Policies
CREATE POLICY "Anyone can view active startups"
  ON startups FOR SELECT
  USING (is_active = true);

CREATE POLICY "Students can create own startups"
  ON startups FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own startups"
  ON startups FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own startups"
  ON startups FOR DELETE
  USING (auth.uid() = student_id);

-- Matches RLS Policies
CREATE POLICY "Mentors and students can view their matches"
  ON matches FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = student_id);

CREATE POLICY "Mentors can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors and students can update their matches"
  ON matches FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = student_id);

-- Meetings RLS Policies
CREATE POLICY "Mentors and mentees can view their meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentors and mentees can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentors and mentees can update their meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Missions RLS Policies
CREATE POLICY "Students can view own missions"
  ON missions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update own missions"
  ON missions FOR UPDATE
  USING (auth.uid() = student_id);

-- Badges RLS Policies
CREATE POLICY "Everyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- User Badges RLS Policies
CREATE POLICY "Everyone can view user badges"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "Users can view own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Investor Pipeline RLS Policies
CREATE POLICY "Investors can view own pipeline"
  ON investor_pipeline FOR SELECT
  USING (auth.uid() = investor_id);

CREATE POLICY "Investors can manage own pipeline"
  ON investor_pipeline FOR ALL
  USING (auth.uid() = investor_id);

-- KPI Cache RLS Policies (Admin only)
CREATE POLICY "Admins can view KPI cache"
  ON kpi_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage KPI cache"
  ON kpi_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Activity Log RLS Policies
CREATE POLICY "Users can view own activity log"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================================
-- Functions
-- ================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON startups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investor_pipeline_updated_at
  BEFORE UPDATE ON investor_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Seed Data: Default Badges
-- ================================================================

INSERT INTO badges (name, description, icon_url, criteria) VALUES
  ('First Step', 'Complete your profile', NULL, '{"type": "profile_complete"}'),
  ('Idea Machine', 'Create your first startup idea', NULL, '{"type": "startup_created", "count": 1}'),
  ('MVP Maker', 'Reach MVP stage', NULL, '{"type": "startup_stage", "stage": "mvp"}'),
  ('Revenue Ready', 'Reach revenue stage', NULL, '{"type": "startup_stage", "stage": "revenue"}'),
  ('Funded!', 'Successfully get funded', NULL, '{"type": "startup_stage", "stage": "funded"}'),
  ('Mission Master', 'Complete 10 daily missions', NULL, '{"type": "missions_completed", "count": 10}'),
  ('Streak Keeper', 'Maintain a 7-day streak', NULL, '{"type": "streak_days", "count": 7}'),
  ('Networking Pro', 'Connect with 5 mentors', NULL, '{"type": "mentor_connections", "count": 5}'),
  ('Innovation Leader', 'Reach 1000 innovation score', NULL, '{"type": "innovation_score", "threshold": 1000}');

-- ================================================================
-- Vector Search Function
-- ================================================================

-- Function to find similar profiles/startups using cosine similarity
CREATE OR REPLACE FUNCTION match_profiles(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    1 - (embedding <=> query_embedding) AS similarity
  FROM profiles
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_startups(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    1 - (embedding <=> query_embedding) AS similarity
  FROM startups
  WHERE embedding IS NOT NULL
    AND is_active = true
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

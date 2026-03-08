-- ================================================================
-- Admin Broadcasts Table
-- Tracks messages sent by admins to users via email/whatsapp
-- ================================================================

CREATE TABLE IF NOT EXISTS admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('individual', 'role', 'department', 'startup_founders', 'everyone')),
  audience_filter JSONB DEFAULT '{}'::jsonb,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  channels TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies: admin-only
ALTER TABLE admin_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all broadcasts"
  ON admin_broadcasts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert broadcasts"
  ON admin_broadcasts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

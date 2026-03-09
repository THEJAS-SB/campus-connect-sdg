-- Add missing INSERT policy for missions table
-- Without this, the server action cannot insert new missions (RLS blocks it)
CREATE POLICY "Students can insert own missions"
  ON missions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

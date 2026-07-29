
-- 1) Expand app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'socio';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head_produto';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultora';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- 2) Activity log (timeline)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,           -- 'view' | 'ai_run' | 'save' | 'upload' | etc.
  route text,                    -- pathname when applicable
  title text NOT NULL,           -- human-readable label
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log self read"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "activity_log admin read"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "activity_log self insert"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS activity_log_user_created_idx
  ON public.activity_log (user_id, created_at DESC);

-- 3) Materials: product grouping
ALTER TABLE public.materiais_files
  ADD COLUMN IF NOT EXISTS product text;

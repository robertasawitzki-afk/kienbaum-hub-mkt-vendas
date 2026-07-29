-- NPS/CSAT: planilha manual de relacionamento (item M do ajuste do hub)
-- Alimenta o dashboard de NPS & CSAT. origem='tally' fica reservado para uma
-- futura integração via webhook do Tally; hoje só 'manual' é gravado pela UI.
CREATE TABLE IF NOT EXISTS public.relationship_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('csat', 'nps')),
  cliente text NOT NULL,
  produto text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  quem_atendeu text,
  nota integer NOT NULL,
  origem text NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'tally')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relationship_scores_nota_range CHECK (
    (tipo = 'csat' AND nota BETWEEN 1 AND 5) OR
    (tipo = 'nps' AND nota BETWEEN 0 AND 10)
  )
);

GRANT SELECT, INSERT, DELETE ON public.relationship_scores TO authenticated;
GRANT ALL ON public.relationship_scores TO service_role;

ALTER TABLE public.relationship_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_scores read all authed" ON public.relationship_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "relationship_scores insert self" ON public.relationship_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "relationship_scores delete own" ON public.relationship_scores
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS relationship_scores_tipo_created_idx
  ON public.relationship_scores (tipo, created_at DESC);

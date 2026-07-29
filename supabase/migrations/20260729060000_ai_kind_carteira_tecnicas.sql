-- Histórico por espaço: faltavam kinds para carteira e para as avaliações
-- de técnicas de negociação (GPCT, SPIN/GPCT/BANT), que hoje só existem no
-- activity_log (sem edição/exclusão). ai_outputs vira a fonte única de
-- "conteúdo gerado" reaproveitada no painel do espaço, no Meu Perfil e no
-- Painel Admin.
ALTER TYPE public.ai_kind ADD VALUE IF NOT EXISTS 'carteira';
ALTER TYPE public.ai_kind ADD VALUE IF NOT EXISTS 'tecnicas';

-- Painel Admin precisa ver/moderar o conteúdo gerado de todos os usuários
-- (a policy "own" existente só deixa cada um ver o próprio).
CREATE POLICY "ai_outputs admin read all" ON public.ai_outputs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ai_outputs admin delete" ON public.ai_outputs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

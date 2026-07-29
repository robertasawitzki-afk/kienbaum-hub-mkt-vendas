# Compartilhar o Supabase do "elevate-propose-now" com o Hub

O projeto `elevate-propose-now` (gerador de propostas de competence check) já
tem um Supabase próprio (`zlrpgugjhbnokrdtuqqy.supabase.co`) com só 2 tabelas
(`propostas`, `aceites`). Não há conflito de nomes com as tabelas do hub, então
dá para os dois projetos compartilharem esse mesmo banco.

## 1. Criar o bucket de storage "materiais" (antes de rodar o SQL)

O SQL abaixo cria políticas para um bucket chamado `materiais`, mas o bucket em
si precisa existir primeiro:

1. No [Supabase Dashboard](https://supabase.com/dashboard) do projeto
   `zlrpgugjhbnokrdtuqqy` → **Storage** → **New bucket**.
2. Nome: `materiais`. Deixe **privado** (não marque "Public bucket") — o hub
   usa signed URLs para abrir/baixar os arquivos.
3. Criar.

## 2. Rodar o SQL abaixo no SQL Editor

**Project → SQL Editor → New query**, cole tudo, **Run**.

```sql
create extension if not exists pgcrypto;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles self upsert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ai_outputs
create type public.ai_kind as enum ('simulador','reuniao','deck','concorrencia','email');
create table public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.ai_kind not null,
  title text not null,
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_outputs to authenticated;
grant all on public.ai_outputs to service_role;
alter table public.ai_outputs enable row level security;
create policy "ai_outputs own" on public.ai_outputs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index ai_outputs_user_created_idx on public.ai_outputs (user_id, created_at desc);

-- materiais_files (repositório compartilhado)
create table public.materiais_files (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete set null,
  category text not null,
  title text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.materiais_files to authenticated;
grant all on public.materiais_files to service_role;
alter table public.materiais_files enable row level security;
create policy "materiais read all authed" on public.materiais_files for select to authenticated using (true);
create policy "materiais insert self" on public.materiais_files for insert to authenticated with check (auth.uid() = uploader_id);
create policy "materiais delete own" on public.materiais_files for delete to authenticated using (auth.uid() = uploader_id);
create index materiais_files_category_idx on public.materiais_files (category, created_at desc);

-- storage policies on 'materiais' bucket (crie o bucket manualmente antes — passo 1)
create policy "materiais storage read" on storage.objects for select to authenticated
  using (bucket_id = 'materiais');
create policy "materiais storage insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'materiais' and auth.uid() = owner);
create policy "materiais storage delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'materiais' and auth.uid() = owner);

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cp');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "user_roles self read" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_roles admin read all" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read all profiles
CREATE POLICY "profiles admin read all" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Audit log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  resource text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log admin read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "audit_log auth insert" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at DESC);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

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

-- 4) NPS/CSAT: planilha manual de relacionamento
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
```

## 3. Depois de rodar o SQL

1. Volte para o Claude Code e cole a `service_role` key (Project Settings →
   API) — é a única credencial que falta para eu trocar o `.env` do hub.
2. Se algum Client Partner já tiver conta no gerador de propostas, ele poderá
   logar no hub com o mesmo e-mail/senha (mesmo Supabase Auth) — mas vai
   precisar de uma linha em `user_roles` para acessar telas restritas
   (ex.: Calculadora de Remuneração). Isso é feito depois, via painel Admin do
   hub ou SQL direto.
3. Quem cria conta pela primeira vez em qualquer um dos dois apps já ganha uma
   linha em `public.profiles` automaticamente (trigger `on_auth_user_created`).

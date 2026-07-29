
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

-- storage policies on 'materiais' bucket (bucket created via storage tool)
create policy "materiais storage read" on storage.objects for select to authenticated
  using (bucket_id = 'materiais');
create policy "materiais storage insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'materiais' and auth.uid() = owner);
create policy "materiais storage delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'materiais' and auth.uid() = owner);

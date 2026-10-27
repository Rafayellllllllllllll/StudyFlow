-- StudyFlow 初始数据模型（可重复部署：IF NOT EXISTS / 先删策略再建策略）
-- 在 Supabase SQL 编辑器里按顺序执行 001 再执行 002。
-- 注意：这里不含任何密钥；service_role 密钥绝不要写进前端或本文件。
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null,
  content text not null,
  image_url text,
  image_name text,
  answer text not null,
  analysis text not null default '',
  knowledge_points text[] not null default '{}',
  type text not null,
  difficulty text not null check (difficulty in ('简单','中等','困难')),
  mastery text not null default '未掌握' check (mastery in ('未掌握','部分掌握','已掌握')),
  consecutive_wrong int not null default 0,
  favorite boolean not null default false,
  note text not null default '',
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_mistakes_user_created on public.mistakes (user_id, created_at desc);
create index if not exists idx_mistakes_user_subject on public.mistakes (user_id, subject_id);
create index if not exists idx_mistakes_user_next_review on public.mistakes (user_id, next_review_at) where deleted_at is null;

create table if not exists public.knowledge_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.mistake_knowledge_points (
  mistake_id uuid not null references public.mistakes(id) on delete cascade,
  knowledge_point_id uuid not null references public.knowledge_points(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mistake_id, knowledge_point_id)
);

create table if not exists public.review_records (
  id uuid primary key default gen_random_uuid(),
  mistake_id uuid not null references public.mistakes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  result text not null check (result in ('correct','wrong')),
  reviewed_at timestamptz not null default now(),
  next_review_at timestamptz not null,
  note text not null default ''
);
create index if not exists idx_review_user_mistake on public.review_records (user_id, mistake_id, reviewed_at desc);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  minutes int not null check (minutes > 0 and minutes <= 1440),
  date date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_user_date on public.study_sessions (user_id, date desc);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  done boolean not null default false,
  mistake_id uuid references public.mistakes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_tasks_user_date on public.daily_tasks (user_id, date desc);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark')),
  daily_goal_minutes int not null default 60 check (daily_goal_minutes >= 0 and daily_goal_minutes <= 1440),
  review_intervals int[] not null default array[1,3,7,15,30],
  updated_at timestamptz not null default now()
);

-- updated_at 触发器（重复执行不报错）
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_subjects_updated on public.subjects;
create trigger trg_subjects_updated before update on public.subjects for each row execute function public.set_updated_at();
drop trigger if exists trg_mistakes_updated on public.mistakes;
create trigger trg_mistakes_updated before update on public.mistakes for each row execute function public.set_updated_at();
drop trigger if exists trg_kp_updated on public.knowledge_points;
create trigger trg_kp_updated before update on public.knowledge_points for each row execute function public.set_updated_at();

-- RLS：全部私有表启用，任何人默认看不到别人的数据
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.mistakes enable row level security;
alter table public.knowledge_points enable row level security;
alter table public.mistake_knowledge_points enable row level security;
alter table public.review_records enable row level security;
alter table public.study_sessions enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.user_settings enable row level security;

-- 策略模板：先删再建，保证可重复执行；除 profiles 用 id 外，其余用 user_id
do $$ begin
  -- profiles
  drop policy if exists "profiles_select_own" on public.profiles;
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
  drop policy if exists "profiles_insert_own" on public.profiles;
  create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
  drop policy if exists "profiles_update_own" on public.profiles;
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  drop policy if exists "profiles_delete_own" on public.profiles;
  create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);
end $$;

-- 其余 8 张表的通用策略（用动态 SQL 生成，避免逐表手写遗漏）
do $$
declare t text;
begin
  foreach t in array array['subjects','mistakes','knowledge_points','review_records','study_sessions','daily_tasks','user_settings'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = user_id)', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)', t || '_delete_own', t);
  end loop;
end $$;

-- mistake_knowledge_points：通过关联的错题归属判断本人数据
drop policy if exists "mkp_select_own" on public.mistake_knowledge_points;
create policy "mkp_select_own" on public.mistake_knowledge_points for select using (
  exists (select 1 from public.mistakes m where m.id = mistake_id and m.user_id = auth.uid())
);
drop policy if exists "mkp_insert_own" on public.mistake_knowledge_points;
create policy "mkp_insert_own" on public.mistake_knowledge_points for insert with check (
  exists (select 1 from public.mistakes m where m.id = mistake_id and m.user_id = auth.uid())
);
drop policy if exists "mkp_update_own" on public.mistake_knowledge_points;
create policy "mkp_update_own" on public.mistake_knowledge_points for update using (
  exists (select 1 from public.mistakes m where m.id = mistake_id and m.user_id = auth.uid())
);
drop policy if exists "mkp_delete_own" on public.mistake_knowledge_points;
create policy "mkp_delete_own" on public.mistake_knowledge_points for delete using (
  exists (select 1 from public.mistakes m where m.id = mistake_id and m.user_id = auth.uid())
);

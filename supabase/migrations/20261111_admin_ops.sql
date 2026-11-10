-- Admin giai đoạn 2 (vận hành): cài đặt app (bảo trì, dải thông báo) + log từng lần gọi AI.

-- 1) Cài đặt: ai cũng đọc (app đọc khi khởi động), chỉ service role ghi (qua /api/admin).
--    key 'maintenance' = {on, message, until}; key 'banner' = {on, text, level: 'info'|'warn'}
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "Ai cũng đọc cài đặt app" on public.app_settings;
create policy "Ai cũng đọc cài đặt app" on public.app_settings for select to anon, authenticated using (true);

-- 2) Log gọi AI: mỗi lần thử một model (kể cả lỗi và lần rơi xuống dự phòng) là một dòng.
create table if not exists public.ai_calls (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  model text not null,
  provider text not null,
  ok boolean not null,
  error text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  cost numeric,
  ms integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ai_calls enable row level security;
create index if not exists ai_calls_created_at_idx on public.ai_calls (created_at desc);

-- Thống kê theo ngày (giờ VN) và model trong p_days ngày gần nhất.
create or replace function public.admin_ai_stats(p_days int)
returns table (day date, model text, provider text, calls bigint, errors bigint, tokens bigint, cost numeric, avg_ms integer)
language sql
stable
security definer
set search_path = ''
as $$
  select (c.created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
         c.model, c.provider,
         count(*) as calls,
         count(*) filter (where not c.ok) as errors,
         coalesce(sum(c.prompt_tokens + c.completion_tokens), 0)::bigint as tokens,
         sum(c.cost) as cost,
         coalesce(avg(c.ms), 0)::integer as avg_ms
  from public.ai_calls c
  where c.created_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
  group by 1, 2, 3
  order by 1 desc, 4 desc;
$$;
revoke all on function public.admin_ai_stats(int) from public, anon, authenticated;
grant execute on function public.admin_ai_stats(int) to service_role;

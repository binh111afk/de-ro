-- Bot Telegram báo bất thường: hàm gom số liệu + bảng nhớ lần báo gần nhất của từng loại.
-- Chỉ service role gọi được (endpoint /api/alert trên Vercel).

create table if not exists public.alert_state (
  kind text primary key,
  last_sent_at timestamptz not null default now()
);
alter table public.alert_state enable row level security;
revoke all on public.alert_state from public, anon, authenticated;

create or replace function public.alert_metrics()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'signups_1h', (select count(*) from auth.users where created_at > now() - interval '1 hour'),
    'ai_total_15m', (select count(*) from public.ai_calls where created_at > now() - interval '15 minutes'),
    'ai_err_15m', (select count(*) from public.ai_calls where created_at > now() - interval '15 minutes' and not ok),
    'ai_ok_10m', (select count(*) from public.ai_calls where created_at > now() - interval '10 minutes' and ok),
    'ai_total_10m', (select count(*) from public.ai_calls where created_at > now() - interval '10 minutes'),
    'ai_cost_today', (select coalesce(sum(cost), 0) from public.ai_calls
                      where (created_at at time zone 'Asia/Ho_Chi_Minh')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date),
    'maintenance_since', (select case when coalesce((value ->> 'on')::boolean, false) then updated_at end
                          from public.app_settings where key = 'maintenance')
  )
$$;
revoke all on function public.alert_metrics() from public, anon, authenticated;
grant execute on function public.alert_metrics() to service_role;

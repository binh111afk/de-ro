-- Cảnh báo Telegram thêm 2 loại: API trả 5xx và đơn PayOS lỗi.
-- api_errors: server ghi mỗi lần trả 5xx (server/http.ts); chỉ service_role đọc / ghi.
create table if not exists public.api_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  status int not null,
  path text not null default ''
);
alter table public.api_errors enable row level security;
revoke all on public.api_errors from public, anon, authenticated;
grant all on public.api_errors to service_role;
create index if not exists api_errors_at_idx on public.api_errors (at desc);

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
                          from public.app_settings where key = 'maintenance'),
    'api_5xx_15m', (select count(*) from public.api_errors where at > now() - interval '15 minutes'),
    'pay_failed_1h', (select count(*) from public.payment_orders where status = 'failed' and created_at > now() - interval '1 hour')
  )
$$;
revoke all on function public.alert_metrics() from public, anon, authenticated;
grant execute on function public.alert_metrics() to service_role;

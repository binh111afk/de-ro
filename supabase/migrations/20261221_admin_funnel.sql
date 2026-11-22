-- Phễu người dùng cho admin → Số liệu. p_days = 0: toàn bộ người dùng; > 0: chỉ người đăng ký trong p_days ngày gần nhất.
-- Chỉ service_role gọi được (server/adminStats.ts).
create or replace function public.admin_funnel(p_days int default 0)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with cohort as (
    select u.id, u.created_at
    from auth.users u
    where p_days <= 0 or u.created_at >= now() - make_interval(days => least(p_days, 365))
  ),
  flags as (
    select c.id,
           c.created_at,
           coalesce(p.active_days, 0) >= 2 as returned,
           exists (select 1 from public.user_items i where i.owner_id = c.id and i.kind in ('doc', 'deck', 'board', 'online')) as made,
           exists (select 1 from public.ai_calls a where a.user_id = c.id and a.ok) as used_ai,
           exists (select 1 from public.payment_orders o where o.user_id = c.id and o.status = 'paid') as paid
    from cohort c
    left join public.presence p on p.user_id = c.id
  ),
  weeks as (
    select date_trunc('week', created_at at time zone 'Asia/Ho_Chi_Minh')::date as week,
           count(*) as signed_up,
           count(*) filter (where returned) as returned,
           count(*) filter (where made) as made,
           count(*) filter (where used_ai) as used_ai,
           count(*) filter (where paid) as paid
    from flags
    group by 1
    order by 1 desc
    limit 12
  ),
  hot as (
    select a.user_id, count(*) as calls, coalesce(sum(a.billed), 0) as billed
    from public.ai_calls a
    where a.ok
      and a.user_id in (select id from flags where not paid)
    group by a.user_id
    order by count(*) desc
    limit 20
  )
  select jsonb_build_object(
    'signed_up', (select count(*) from flags),
    'returned', (select count(*) from flags where returned),
    'made', (select count(*) from flags where made),
    'used_ai', (select count(*) from flags where used_ai),
    'paid', (select count(*) from flags where paid),
    'weeks', coalesce((select jsonb_agg(to_jsonb(w) order by w.week desc) from weeks w), '[]'::jsonb),
    'hot', coalesce((select jsonb_agg(to_jsonb(h)) from hot h), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_funnel(int) from public, anon, authenticated;
grant execute on function public.admin_funnel(int) to service_role;

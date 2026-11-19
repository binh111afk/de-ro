-- Doanh thu nạp điểm cho trang admin: cộng tiền đơn đã trả theo từng khoảng (kỳ này và kỳ trước) và theo tháng giờ Việt Nam.
-- Thay cho việc kéo toàn bộ đơn đã trả về server (bị giới hạn số dòng của PostgREST).
create or replace function public.admin_revenue_ranges(p_from timestamptz[], p_to timestamptz[])
returns table (idx int, vnd bigint, n bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.i::int,
         coalesce(sum(o.vnd), 0)::bigint,
         count(o.order_code)
  from unnest(p_from, p_to) with ordinality as r(f, t, i)
  left join public.payment_orders o
    on o.status = 'paid' and o.paid_at >= r.f and o.paid_at < r.t
  group by r.i
  order by r.i;
$$;

create or replace function public.admin_revenue_monthly(p_months int)
returns table (month text, vnd bigint, n bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select to_char(date_trunc('month', o.paid_at at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM'),
         coalesce(sum(o.vnd), 0)::bigint,
         count(*)
  from public.payment_orders o
  where o.status = 'paid'
    and o.paid_at >= (date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') - make_interval(months => greatest(1, least(p_months, 60)) - 1)) at time zone 'Asia/Ho_Chi_Minh'
  group by 1
  order by 1 desc;
$$;

revoke all on function public.admin_revenue_ranges(timestamptz[], timestamptz[]) from public, anon, authenticated;
revoke all on function public.admin_revenue_monthly(int) from public, anon, authenticated;
grant execute on function public.admin_revenue_ranges(timestamptz[], timestamptz[]) to service_role;
grant execute on function public.admin_revenue_monthly(int) to service_role;

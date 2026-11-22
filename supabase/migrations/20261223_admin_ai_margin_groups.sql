-- Lãi / lỗ AI ở admin (server/adminAiMargin.ts): gộp ai_calls ở phía DB thay vì kéo từng dòng về server.
-- Mỗi nhóm = (loại tác vụ, nhà cung cấp, thành công?, chưa có cost?, có trừ điểm?, trong kỳ chọn?, trong tháng?).
-- Chỉ service_role gọi được.
create or replace function public.admin_ai_margin_groups(p_since timestamptz, p_month_start timestamptz, p_until timestamptz)
returns table (
  kind text,
  provider text,
  ok boolean,
  cost_null boolean,
  billed_pos boolean,
  in_window boolean,
  in_month boolean,
  n bigint,
  billed numeric,
  cost numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(c.kind), ''), 'other'),
         c.provider,
         c.ok,
         c.cost is null,
         coalesce(c.billed, 0) > 0,
         c.created_at >= p_since,
         c.created_at >= p_month_start,
         count(*),
         coalesce(sum(c.billed), 0),
         coalesce(sum(c.cost), 0)
  from public.ai_calls c
  where c.created_at >= least(p_since, p_month_start)
    and c.created_at <= p_until
  group by 1, 2, 3, 4, 5, 6, 7
$$;

revoke all on function public.admin_ai_margin_groups(timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_ai_margin_groups(timestamptz, timestamptz, timestamptz) to service_role;

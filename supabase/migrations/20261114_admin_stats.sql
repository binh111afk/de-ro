-- Admin giai đoạn 5 (Số liệu): thống kê người dùng, tài liệu và trạng thái hoạt động.

-- 1) Cột created_at trong user_items:
-- Thêm cột không có default trước để các dòng cũ giữ nguyên giá trị null (không biết ngày tạo thật, không gán bằng updated_at).
alter table public.user_items add column if not exists created_at timestamptz;
alter table public.user_items alter column created_at set default now();

-- Trigger bảo vệ created_at khi upsert/update (giữ nguyên ngày tạo ban đầu, không cho ghi đè).
create or replace function public.preserve_user_items_created_at()
returns trigger
language plpgsql
as $$
begin
  new.created_at = old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_preserve_user_items_created_at on public.user_items;
create trigger trg_preserve_user_items_created_at
before update on public.user_items
for each row execute function public.preserve_user_items_created_at();

create index if not exists user_items_created_at_idx on public.user_items (created_at desc) where created_at is not null;

-- 2) Bảng presence: nhịp online của người dùng đã đăng nhập.
create table if not exists public.presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen timestamptz not null default now()
);
alter table public.presence enable row level security;

-- RLS: Người đăng nhập chỉ insert / update dòng của chính mình, không ai đọc.
drop policy if exists "presence insert own" on public.presence;
create policy "presence insert own" on public.presence
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "presence update own" on public.presence;
create policy "presence update own" on public.presence
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists presence_last_seen_idx on public.presence (last_seen desc);

revoke all on public.presence from public, anon;
grant insert, update on public.presence to authenticated;
grant all on public.presence to service_role;

-- 3) RPC admin_stats_overview: tổng quan số liệu theo ngày (giờ Asia/Ho_Chi_Minh) và các tổng.
create or replace function public.admin_stats_overview(p_days int)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days int;
  v_start_tz timestamptz;
  v_total_users bigint;
  v_active_7d bigint;
  v_active_30d bigint;
  v_online_count bigint;
  v_daily jsonb;
begin
  v_days := greatest(1, least(coalesce(p_days, 7), 90));
  v_start_tz := ((now() at time zone 'Asia/Ho_Chi_Minh')::date - (v_days - 1))::timestamp at time zone 'Asia/Ho_Chi_Minh';

  -- Tổng số người dùng
  select count(*) into v_total_users from auth.users;

  -- Số người đang online (có nhịp presence trong vòng 2 phút)
  select count(*) into v_online_count
  from public.presence
  where last_seen >= now() - interval '2 minutes';

  -- Hoạt động trong 7 ngày và 30 ngày (theo last_sign_in_at hoặc presence.last_seen, lấy mốc mới hơn)
  select
    count(*) filter (where greatest(u.last_sign_in_at, p.last_seen) >= now() - interval '7 days'),
    count(*) filter (where greatest(u.last_sign_in_at, p.last_seen) >= now() - interval '30 days')
  into v_active_7d, v_active_30d
  from auth.users u
  left join public.presence p on p.user_id = u.id;

  -- Dữ liệu theo từng ngày trong khoảng v_days ngày gần nhất
  with date_range as (
    select (
      generate_series(
        (now() at time zone 'Asia/Ho_Chi_Minh')::date - (v_days - 1),
        (now() at time zone 'Asia/Ho_Chi_Minh')::date,
        '1 day'::interval
      )
    )::date as day
  ),
  new_users_daily as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
           count(*) as count
    from auth.users
    where created_at >= v_start_tz
    group by 1
  ),
  new_items_daily as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
           count(*) filter (where kind = 'doc') as docs,
           count(*) filter (where kind = 'deck') as decks
    from public.user_items
    where created_at is not null
      and created_at >= v_start_tz
    group by 1
  ),
  new_community_daily as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
           count(*) as count
    from public.community_exams
    where created_at >= v_start_tz
    group by 1
  )
  select jsonb_agg(
    jsonb_build_object(
      'day', d.day::text,
      'new_users', coalesce(u.count, 0),
      'new_docs', coalesce(i.docs, 0),
      'new_decks', coalesce(i.decks, 0),
      'new_community_exams', coalesce(c.count, 0)
    ) order by d.day asc
  ) into v_daily
  from date_range d
  left join new_users_daily u on u.day = d.day
  left join new_items_daily i on i.day = d.day
  left join new_community_daily c on c.day = d.day;

  return jsonb_build_object(
    'total_users', coalesce(v_total_users, 0),
    'active_7d', coalesce(v_active_7d, 0),
    'active_30d', coalesce(v_active_30d, 0),
    'online_count', coalesce(v_online_count, 0),
    'days', coalesce(v_daily, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_stats_overview(int) from public, anon, authenticated;
grant execute on function public.admin_stats_overview(int) to service_role;

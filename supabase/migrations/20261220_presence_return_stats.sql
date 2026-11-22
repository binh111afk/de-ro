-- Đếm lần quay lại web của từng người dùng (hiện ở admin → Người dùng).
-- visits: số phiên (mở phiên mới khi im lặng quá 30 phút). active_days: số ngày (giờ Việt Nam) có hoạt động.
-- Mọi cột do trigger đặt; giá trị client gửi lên bị bỏ qua.
alter table public.presence
  add column if not exists first_day date,
  add column if not exists last_day date,
  add column if not exists visits integer not null default 1,
  add column if not exists active_days integer not null default 1;

update public.presence
set first_day = (last_seen at time zone 'Asia/Ho_Chi_Minh')::date,
    last_day = (last_seen at time zone 'Asia/Ho_Chi_Minh')::date
where first_day is null;

create or replace function public.presence_set_last_seen()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  new.last_seen := now();
  if tg_op = 'INSERT' then
    new.first_day := today;
    new.last_day := today;
    new.visits := 1;
    new.active_days := 1;
  else
    new.first_day := old.first_day;
    new.last_day := greatest(old.last_day, today);
    new.visits := old.visits + case when old.last_seen < now() - interval '30 minutes' then 1 else 0 end;
    new.active_days := old.active_days + case when today > old.last_day then 1 else 0 end;
  end if;
  return new;
end;
$$;

revoke all on function public.presence_set_last_seen() from public, anon, authenticated;

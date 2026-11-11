-- Cảnh cáo người không có quyền nhưng cố gọi API admin: lần 1 khoá 3 ngày + gắn cờ, lần 2 khoá vĩnh viễn.
-- Chỉ service role đọc/ghi (RLS bật, không có policy).
create table if not exists public.security_flags (
  user_id uuid primary key references auth.users (id) on delete cascade,
  strikes integer not null default 0,
  locked_until timestamptz,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  last_action text,
  last_ip text
);
alter table public.security_flags enable row level security;

-- Ghi một lần vi phạm. Đang trong thời gian khoá thì KHÔNG tính thêm (một loạt request liên tiếp chỉ là một lần).
create or replace function public.record_security_strike(p_user uuid, p_action text, p_ip text)
returns table (strikes integer, is_new boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.security_flags%rowtype;
begin
  insert into public.security_flags (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into v from public.security_flags f where f.user_id = p_user for update;
  if v.locked_until is not null and v.locked_until > now() then
    return query select v.strikes, false;
    return;
  end if;
  update public.security_flags f
     set strikes = v.strikes + 1,
         locked_until = case when v.strikes + 1 >= 2 then 'infinity'::timestamptz else now() + interval '3 days' end,
         last_at = now(),
         last_action = left(p_action, 60),
         last_ip = left(p_ip, 60)
   where f.user_id = p_user;
  return query select v.strikes + 1, true;
end;
$$;
revoke all on function public.record_security_strike(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_security_strike(uuid, text, text) to service_role;
